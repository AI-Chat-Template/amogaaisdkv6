"use client";

import { type DataUpload, DataUploadStatuses } from "../type";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { updateRecord, createRecord } from "../_lib/actions";
import {
  type UpdateDataUploadSchema,
  updateDataUploadSchema,
} from "../_lib/validations";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Step1 from "./steps/step-1";
import ProgressIndicator from "./steps/progress-indicator";
import Step2 from "./steps/step-2";
import Step3 from "./steps/step-3";
import Step4 from "./steps/step-4";

interface UpdateRecordSheetProps
  extends React.ComponentPropsWithRef<typeof Dialog> {
  record: DataUpload | null;
  isNew?: boolean;
}

type Template = {
  data_upload_setup_id: number;
  template_name: string;
  data_table_name: string;
  file_csv_field_json: JSON;
  template_file_fields_json: Record<
    string,
    { field_name: string; required?: boolean | undefined }
  >;
};

const steps = [
  "Select Template",
  "Select Raw BOM File",
  "Review Final BOM",
  "Save Final BOM",
];

const convertRequiredField = (value: unknown): boolean => {
  if (typeof value === "string") {
    return value.toLowerCase() === "yes";
  }
  return !!value;
};

export function UpdateRecordSheet({
  record,
  isNew = false,
  ...props
}: UpdateRecordSheetProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isUpdatePending, startUpdateTransition] = React.useTransition();
  const [file, setFile] = React.useState<File>();
  const [fileData, setFileData] = React.useState<
    Record<string, string>[] | undefined
  >();
  const [fileDataHeaders, setFileDataHeaders] = React.useState<
    string[] | undefined
  >([]);
  const [fileEditedData, setFileEditedData] = React.useState<
    Record<string, string>[] | undefined
  >();
  const [editedCells, setEditedCells] = React.useState<Record<string, boolean>>(
    {}
  );
  const [selectedTemplate, setSelectedTemplate] = React.useState<
    Template | undefined
  >();
  const [fileColumnsValidated, setFileColumnsValidated] =
    React.useState<boolean>(false);
  const [uploadCompleted, setUploadCompleted] = React.useState<boolean>(false);
  const form = useForm<UpdateDataUploadSchema>({
    resolver: zodResolver(updateDataUploadSchema),
  });

  React.useEffect(() => {
    const schemaKeys = Object.keys(updateDataUploadSchema.shape);

    const sanitizedRecord = Object.fromEntries(
      Object.entries(record || {})
        .filter(([key]) => schemaKeys.includes(key))
        .map(([key, value]) => [key, value ?? ""])
    );

    form.reset({
      ...sanitizedRecord,
      status: record?.status || DataUploadStatuses[0],
    });
  }, [record, form, isNew]);

  function onSubmit(input: UpdateDataUploadSchema) {
    return;
    startUpdateTransition(async () => {
      let response;
      if (isNew) {
        response = await createRecord({ ...input, file });
      } else {
        if (!record) return;
        response = await updateRecord({
          id: record.data_upload_uuid,
          ...input,
          file,
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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0) {
      setFile(undefined);
      setFileData([]);
      setFileEditedData([]);
      setFileColumnsValidated(false);
      // toast.error("No file selected.");
      return;
    }

    const selectedFile = event.target.files[0];

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file.");
      return;
    }

    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const headers = results.meta.fields;
        const rows = results.data;

        setFileDataHeaders(headers);
        setFileData(rows as Record<string, string>[]);
        setFileEditedData(
          JSON.parse(JSON.stringify(rows)) as Record<string, string>[]
        );

        toast.success("CSV parsed successfully!");
      },
      error: function (error) {
        console.error("Error parsing CSV:", error);
        toast.error("Error parsing CSV file.");
      },
    });
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === 0 && (!fileData || fileData.length === 0)) {
        toast.error("No file selected.");
        return;
      } else if (currentStep === 0 && !selectedTemplate) {
        toast.error("No Template selected.");
        return;
      } else if (currentStep === 1 && !fileColumnsValidated) {
        toast.error("There is some required columns missing.");
        return;
      } else if (currentStep === 2 && fileEditedData) {
        // Check for missing required data
        const missingData: { row: number; columns: string[] }[] = [];
        fileEditedData.forEach((row, index) => {
          const missingColumns: string[] = [];
          Object.entries(
            selectedTemplate?.template_file_fields_json ?? {}
          ).forEach(([columnName, config]) => {
            if (
              convertRequiredField(config.required) &&
              (!row[columnName] || row[columnName].trim() === "")
            ) {
              missingColumns.push(columnName);
            }
          });
          if (missingColumns.length > 0) {
            missingData.push({ row: index + 1, columns: missingColumns });
          }
        });

        if (missingData.length > 0) {
          toast.error(
            `Required data missing in ${missingData.length} rows. Please fill in all required fields.`
          );
          return;
        }
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0 && !uploadCompleted) {
      if (currentStep == 2) {
        setFileEditedData(JSON.parse(JSON.stringify(fileData)));
        setEditedCells({});
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const reset = () => {
    setCurrentStep(0);

    const schemaKeys = Object.keys(updateDataUploadSchema.shape);

    const sanitizedRecord = Object.fromEntries(
      Object.entries(record || {})
        .filter(([key]) => schemaKeys.includes(key))
        .map(([key, value]) => [key, value ?? ""])
    );

    form.reset({
      ...sanitizedRecord,
      status: record?.status || DataUploadStatuses[0],
    });

    setFile(undefined);
    setFileData([]);
    setFileEditedData([]);
    setEditedCells({});
    setFileColumnsValidated(false);
    setUploadCompleted(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1
            form={form}
            handleFileChange={handleFileChange}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
          />
        );
      case 1:
        return (
          <Step2
            form={form}
            fileData={fileData}
            fileDataHeaders={fileDataHeaders}
            templateColumns={selectedTemplate?.template_file_fields_json}
            setFileColumnsValidated={setFileColumnsValidated}
          />
        );
      case 2:
        return (
          <Step3
            form={form}
            fileData={fileEditedData ?? []}
            originalData={JSON.parse(JSON.stringify(fileData))}
            editedCells={editedCells}
            setEditedCells={setEditedCells}
            setFileEditedData={setFileEditedData}
            templateColumns={selectedTemplate?.template_file_fields_json}
          />
        );
      case 3:
        return (
          <Step4
            form={form}
            data={fileEditedData}
            templateId={selectedTemplate?.data_upload_setup_id}
            onComplete={(success) => {
              if (success) {
                setUploadCompleted(true);
              }
            }}
            fileName={file?.name}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      {...props}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          reset();
          props.onOpenChange?.(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Create Data Upload" : "Update Data Upload"}
          </DialogTitle>
          <DialogDescription>
            {isNew
              ? "Enter details to create a new Data Upload."
              : "Update the Data Upload details and save the changes."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 w-full overflow-auto"
          >
            <div className="mb-8">
              <ProgressIndicator steps={steps} currentStep={currentStep} />
            </div>
            <div className="">{renderStep()}</div>
            <DialogFooter className="gap-2 pt-2 sm:space-x-0 flex">
              {currentStep === steps.length - 1 ? (
                <div className="flex w-full justify-between">
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    disabled={uploadCompleted}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-2">
                    <DialogClose asChild>
                      <Button
                        disabled={isUpdatePending}
                        type="button"
                        variant="outline"
                      >
                        Close
                      </Button>
                    </DialogClose>
                  </div>
                </div>
              ) : currentStep === 0 ? (
                <>
                  <div></div> {/* Empty div to maintain spacing */}
                  <Button type="button" onClick={nextStep} variant="outline">
                    Next
                  </Button>
                </>
              ) : (
                <div className="flex w-full justify-between">
                  <Button type="button" onClick={prevStep} variant="outline">
                    Previous
                  </Button>
                  <Button type="button" onClick={nextStep} variant="outline">
                    Next
                  </Button>
                </div>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
