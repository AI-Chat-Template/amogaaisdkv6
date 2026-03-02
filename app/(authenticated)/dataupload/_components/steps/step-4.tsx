"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Download, Loader2, Eye } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { UseFormReturn } from "react-hook-form";
import type { UpdateDataUploadSchema } from "../../_lib/validations";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { gzip } from "pako";
import Link from "next/link";

interface Step4Props {
  form: UseFormReturn<UpdateDataUploadSchema, unknown, undefined>;
  data: Record<string, string>[] | undefined;
  templateId?: number | undefined;
  onComplete?: (success: boolean) => void;
  fileName?: string;
}

type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

interface UploadError {
  message: string;
  code?: string;
}

export default function Step4({
  data,
  templateId,
  onComplete,
  fileName,
}: Step4Props) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [failedRows, setFailedRows] = useState<
    { row: number; error: string; data: Record<string, unknown> }[]
  >([]);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(
    null
  );
  const [uploadRecordID, setUploadRecordID] = useState<number | null>(null);

  const handleUploadError = (error: unknown) => {
    setUploadStatus("error");
    const errorMessage =
      (error as { message?: string }).message || "Upload failed";
    const errorCode = (error as { code?: string }).code;
    setUploadError({
      message: errorMessage,
      code: errorCode,
    });
    console.log("uploadError", uploadError);
    toast.error(errorMessage);
  };

  const convertJSONToCSV = (jsonData: Record<string, string>[]) => {
    return Papa.unparse(jsonData);
  };

  const handleStart = async () => {
    if (!data || !data.length || !templateId) {
      toast.error("No data to upload or template not selected");
      return;
    }

    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadErrorMessage(null);
    if (onComplete) {
      onComplete(true);
    }

    try {
      const csvData = convertJSONToCSV(data);
      const compressedData = gzip(csvData);
      const compressedBlob = new Blob([compressedData], {
        type: "application/gzip",
      });

      const formData = new FormData();
      formData.append("file", compressedBlob, "data.csv.gz");
      formData.append("templateId", String(templateId));
      formData.append("dataUploadGroup", "Data Upload");
      formData.append("fileName", fileName || "file_name_unknown.csv");

      // Upload data
      const response = await axios.post("/api/upload-data/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded / progressEvent.total!) * 100
          );
          setUploadProgress(progress);
          if (progress === 100) {
            setUploadStatus("processing");
          }
        },
      });

      const { success, error, errors, data: uploadRecordData } = response.data;

      if (!success) {
        setUploadStatus("error");
        if (errors?.length) setFailedRows(errors);
        toast.error(error || "Upload failed");
        if (error) {
          setUploadErrorMessage(error);
        }
      } else {
        setUploadStatus("done");
        toast.success("Upload successful");
        if (uploadRecordData?.upload_record_id) {
          setUploadRecordID(uploadRecordData?.upload_record_id);
        }
        router.refresh();
      }

      if (onComplete) {
        onComplete(success);
      }
    } catch (error: unknown) {
      handleUploadError(error);
    } finally {
      setIsUploading(false);

      if (onComplete) {
        onComplete(uploadStatus === "done");
      }
    }
  };

  const handleDownloadFailLogs = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const downloadFaildLogs = () => {
      // Build the log content as plain text
      const logContent = failedRows
        .map(
          (row) =>
            `Row ${row.row}: ${row.error}\nData: ${JSON.stringify(row.data)}\n`
        )
        .join("\n");

      // Create a blob and download link
      const blob = new Blob([logContent], {
        type: "text/plain;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "FailLogs.txt");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // handleDownloadFailLogs();
    // return;

    function convertJSONToCSV(jsonData: Record<string, unknown>[]) {
      // Extract keys from the first object to create the header row
      const headers = Object.keys(jsonData[0]).join(",") + "\n";

      // Map each object to a row of values
      const rows = jsonData
        .map((obj) => Object.values(obj).join(","))
        .join("\n");

      // Combine header and rows
      return headers + rows;
    }

    // Create CSV content
    const csvContent = convertJSONToCSV(failedRows.map((row) => row.data));

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "FailLogs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Save Data</h2>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-sm font-medium">
                {uploadStatus === "uploading"
                  ? `Uploading ${uploadProgress}%`
                  : uploadStatus === "processing"
                  ? "Processing data..."
                  : uploadStatus === "done"
                  ? "Complete"
                  : uploadStatus === "error"
                  ? "Failed"
                  : "Ready"}
              </span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
          {uploadStatus === "error" && failedRows.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upload Errors</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{failedRows.length} rows failed</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadFailLogs}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Errors
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {uploadErrorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upload Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{uploadErrorMessage} </span>
              </AlertDescription>
            </Alert>
          )}
          {uploadStatus === "done" && (
            <Alert className="border-green-600 text-green-600 [&>svg]:text-green-600">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Upload Complete</AlertTitle>
            </Alert>
          )}
          {uploadStatus === "done" && uploadRecordID ? (
            <>
              <div className="h-2"></div>
              <Link
                href={`/dataupload/${uploadRecordID}/items`}
                className="w-full"
              >
                <Button className="w-full">
                  <Eye className="size-8" /> View Inserted Data
                </Button>
              </Link>
            </>
          ) : (
            <Button
              onClick={handleStart}
              className="w-full"
              disabled={
                isUploading ||
                !data ||
                !data.length ||
                !(uploadStatus === "idle" || uploadStatus === "error")
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadStatus === "processing"
                    ? "Processing..."
                    : "Uploading..."}
                </>
              ) : (
                "Start Upload"
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
