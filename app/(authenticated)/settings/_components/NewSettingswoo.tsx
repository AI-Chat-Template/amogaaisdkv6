"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// WooCommerce actions
import {
  getWooSettingsData,
  saveWooFieldsSettings,
  editWooFieldsSettings,
} from "../actions";
import { useTranslations } from "next-intl";

const wooSchema = z.object({
  apiname: z.string().min(1, "API Name is required"),
  App_name: z.string().min(1, "App Name is required"),
  site_url: z.string().url("Valid URL required"),
  consumer_key: z.string().min(10, "Consumer key is too short"),
  consumer_secret: z.string().min(10, "Consumer secret is too short"),
  status: z.enum(["active", "inactive"]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
type WooSchemaType = z.infer<typeof wooSchema>;

const NewSettingswoo = ({ id }: { id?: string }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const form = useForm<WooSchemaType>({
    resolver: zodResolver(wooSchema),
    defaultValues: {
      apiname: "",
      App_name: "",
      site_url: "",
      consumer_key: "",
      consumer_secret: "",
      status: "inactive", // default inactive for new items
      created_at: "",
      updated_at: "",
    },
  });

  const randomId = uuidv4();
  const editIdRef = React.useRef<string | undefined>(id);

  // Load existing data on mount if editing
  React.useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const response = await getWooSettingsData();
        const arr = (response?.data?.api_connection_json ?? []) as any[];
        const row = arr.find((x) => x?.id === id);
        if (row) {
          form.reset({
            apiname: row.apiname ?? "",
            App_name: row.App_name ?? "",
            site_url: row.site_url ?? "",
            consumer_key: row.consumer_key ?? "",
            consumer_secret: row.consumer_secret ?? "",
            status: row.status ?? "inactive", // use saved status
            created_at: row.created_at ?? "",
            updated_at: row.updated_at ?? "",
          });
          editIdRef.current = id;
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load settings for edit.");
      }
    };
    load();
  }, [form, id]);

  const t = useTranslations("Settings.newWooConnection");

  const reset = () => form.reset();

  const handleFormSubmit = async (values: WooSchemaType) => {
    try {
      setIsLoading(true);
      const payload = {
        ...values,
        created_at: values.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const res = editIdRef.current
        ? await editWooFieldsSettings(editIdRef.current, payload)
        : await saveWooFieldsSettings(payload, randomId);

      if (!res?.success) {
        toast.error("Error saving WooCommerce settings");
      } else {
        toast.success("WooCommerce settings saved successfully");
      }
    } catch (error) {
      toast.error(`${error}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold">
                {id ? "Edit WooCommerce" : t("title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("description")}
              </p>
            </div>
            <div>
              <Link href="/settings">
                <Button variant="outline">
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />{" "}
                  {t("backButton")}
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <FormField
              control={form.control}
              name="apiname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("apiName")}</FormLabel>
                  <Input type="text" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="App_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("appName")}</FormLabel>
                  <Input type="text" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="site_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("apiUrl")}</FormLabel>
                  <Input
                    type="url"
                    placeholder="https://store.example.com"
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consumer_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("consumerKey")}</FormLabel>
                  <Input type="text" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consumer_secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("consumerSecret")}</FormLabel>
                  <Input type="text" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </CardContent>

        <CardFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button variant={"outline"} onClick={reset} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(handleFormSubmit)}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewSettingswoo;
