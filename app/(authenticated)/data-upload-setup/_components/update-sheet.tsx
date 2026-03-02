"use client";

import { type DataGroup, dataGroupStatuses } from "../type";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateRecord, createRecord } from "../_lib/actions";
import {
  type UpdateDataGroupSchema,
  updateDataGroupSchema,
} from "../_lib/validations";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ZodNullable, ZodOptional } from "zod";
import { Textarea } from "@/components/ui/textarea";
import dataUploadGroupTypes from "@/data/data_upload_group.json";

interface UpdateRecordSheetProps
  extends React.ComponentPropsWithRef<typeof Dialog> {
  record: DataGroup | null;
  isNew?: boolean;
}

export function UpdateRecordSheet({
  record,
  isNew = false,
  ...props
}: UpdateRecordSheetProps) {
  const [isUpdatePending, startUpdateTransition] = React.useTransition();

  const form = useForm<UpdateDataGroupSchema>({
    resolver: zodResolver(updateDataGroupSchema),
  });

  React.useEffect(() => {
    form.reset({
      template_name: record?.template_name || "",
      template_file_fields_json: record?.template_file_fields_json,
      data_upload_group: record?.data_upload_group || "",
      status: record?.status || dataGroupStatuses[0],
      data_table_name: record?.data_table_name || "",
    });
  }, [record, form]);

  function onSubmit(input: UpdateDataGroupSchema) {
    startUpdateTransition(async () => {
      let response;
      const formattedInput = {
        ...input,
        template_file_fields_json:
          typeof input.template_file_fields_json === "string"
            ? JSON.parse(input.template_file_fields_json)
            : input.template_file_fields_json,
      };
      if (isNew) {
        response = await createRecord({ ...formattedInput });
      } else {
        if (!record) return;
        response = await updateRecord({
          id: record.data_upload_setup_id,
          ...formattedInput,
        });
      }

      if (response.error) {
        toast.error(response.error);
        return;
      }

      form.reset();
      props.onOpenChange?.(false);
      toast.success(isNew ? "Record created" : "Record updated");
    });
  }

  function isFieldRequired(
    fieldName: keyof (typeof updateDataGroupSchema)["shape"]
  ) {
    const fieldSchema = updateDataGroupSchema.shape[fieldName];
    // If the field is wrapped in ZodOptional or ZodNullable, it's not required.
    return !(
      fieldSchema instanceof ZodOptional || fieldSchema instanceof ZodNullable
    );
  }

  return (
    <Dialog {...props}>
      <DialogContent className="sm:max-w-ld max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? " Data Upload Setup" : "Update Data Upload Setup"}
          </DialogTitle>
          <DialogDescription>
            {isNew
              ? "Enter details to create a new Data Group."
              : "Update the Data Group details and save the changes."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="data_upload_group"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>
                      Data Upload Group{" "}
                      {isFieldRequired(field.name) && (
                        <span className="text-red-500">*</span>
                      )}
                    </span>
                    {fieldState.error && <FormMessage />}
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Select a Data Upload Group" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          {dataUploadGroupTypes.map((dataGroupType) => (
                            <SelectItem
                              key={dataGroupType.value}
                              value={dataGroupType.value}
                            >
                              {dataGroupType.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="template_name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>
                      Template Name{" "}
                      {isFieldRequired(field.name) && (
                        <span className="text-red-500">*</span>
                      )}
                    </span>
                    {fieldState.error && <FormMessage />}
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data_table_name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>
                      Data Table Name{" "}
                      {isFieldRequired(field.name) && (
                        <span className="text-red-500">*</span>
                      )}
                    </span>
                    {fieldState.error && <FormMessage />}
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="template_file_fields_json"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>
                      File CSV Field JSON{" "}
                      {isFieldRequired(field.name) && (
                        <span className="text-red-500">*</span>
                      )}{" "}
                    </span>

                    {fieldState.error && <FormMessage />}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={
                        typeof field.value === "object"
                          ? JSON.stringify(field.value, null, 2)
                          : field.value ?? ""
                      }
                      onChange={(e) => {
                        try {
                          const value = e.target.value;
                          if (value.trim() === "") {
                            field.onChange("");
                            return;
                          }
                          // Only try to parse if it looks like JSON
                          if (
                            value.trim().startsWith("{") ||
                            value.trim().startsWith("[")
                          ) {
                            const parsedValue = JSON.parse(value);
                            field.onChange(parsedValue); // Store as string
                          } else {
                            field.onChange(value);
                          }
                        } catch (error) {
                          console.error("Error parsing JSON:", error);
                          // If parsing fails, just set the raw string value
                          field.onChange(e.target.value);
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {dataGroupStatuses.map((item) => (
                          <SelectItem
                            key={item}
                            value={item}
                            className="capitalize"
                          >
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 pt-2 sm:space-x-0">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={isUpdatePending}>
                {isUpdatePending && (
                  <Loader
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
