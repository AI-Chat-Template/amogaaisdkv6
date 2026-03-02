"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { UpdateDataUploadSchema } from "../../_lib/validations";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Step2Props {
  form: UseFormReturn<UpdateDataUploadSchema, unknown, undefined>;
  fileData: Record<string, string>[] | undefined;
  fileDataHeaders: string[] | undefined;
  templateColumns:
    | Record<
        string,
        {
          field_name: string;
          required?: boolean | undefined;
        }
      >
    | undefined;
  setFileColumnsValidated: (isValid: boolean) => void;
}

interface ColumnMapping {
  templateColumn: string;
  fileColumn: string;
  matches: boolean;
  required: boolean;
}

export default function Step2({
  fileData,
  fileDataHeaders,
  templateColumns,
  setFileColumnsValidated,
}: Step2Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      if (!templateColumns || !fileDataHeaders)
        throw "can not find template columns";
      const missing: string[] = [];
      const columnMap: ColumnMapping[] = [];
      Object.entries(templateColumns).forEach(([c, { required }]) => {
        const fc_found = fileDataHeaders.includes(c);
        const fc_required = required ?? true;

        columnMap.push({
          templateColumn: c,
          fileColumn: fc_found ? c : "Not Found",
          matches: fc_found,
          required: fc_required,
        });

        if (fc_required && !fc_found) {
          missing.push(c);
        }
      });

      setColumnMappings(columnMap);
      setMissingColumns(missing);

      setFileColumnsValidated(missing.length === 0 ? true : false);
    } catch (err) {
      console.error("Error parsing file:", err);
      setError(
        "Failed to parse the uploaded file. Please ensure it's a valid CSV, and make sure you have selected template."
      );
    } finally {
      setIsLoading(false);
    }
  }, [templateColumns, setFileColumnsValidated, fileDataHeaders]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Column Validation</h2>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {missingColumns.length > 0 && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">
            Missing Required Columns
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            The following required columns are missing:{" "}
            {missingColumns.join(", ")}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-2">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : columnMappings.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {missingColumns.length === 0 && (
                <Alert className="border-green-600 text-green-600 [&>svg]:text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>
                    All Required Columns Found
                  </AlertTitle>
                  <AlertDescription>
                    The file contains all the required columns for this
                    template.
                  </AlertDescription>
                </Alert>
              )}
              <Table>
                <TableHeader className="sticky top-0">
                  <TableRow>
                    <TableHead>Template Column</TableHead>
                    <TableHead>File Column</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columnMappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell>{mapping.templateColumn}</TableCell>
                      <TableCell>{mapping.fileColumn}</TableCell>
                      <TableCell>
                        {mapping.matches ? (
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="ml-2 text-green-500">Match</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="ml-2 text-red-500">No Match</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              {fileData && "Please upload a file and select a template"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
