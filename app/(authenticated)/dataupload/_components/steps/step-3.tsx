"use client";

import { useState, useEffect, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { UseFormReturn } from "react-hook-form";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { UpdateDataUploadSchema } from "../../_lib/validations";

interface Step3Props {
  form: UseFormReturn<UpdateDataUploadSchema, unknown, undefined>;
  fileData: Record<string, string>[];
  originalData: Record<string, string>[];
  editedCells: Record<string, boolean>;
  setEditedCells: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setFileEditedData: React.Dispatch<
    React.SetStateAction<Record<string, string>[] | undefined>
  >;
  onDataReviewed?: (data: unknown[]) => void;
  templateColumns?: Record<string, { field_name: string; required?: boolean }>;
}

const convertRequiredField = (value: unknown): boolean => {
  if (typeof value === "string") {
    return value.toLowerCase() === "yes";
  }
  return !!value;
};

export default function Step3({
  fileData,
  originalData,
  editedCells,
  setEditedCells,
  setFileEditedData,
  onDataReviewed,
  templateColumns,
}: Step3Props) {
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const pageSizeOptions = [5, 10, 20, 30, 50];

  const [missingRequiredData, setMissingRequiredData] = useState<
    { row: number; columns: string[] }[]
  >([]);

  // Calculate missing fields count
  const missingFieldsCount = missingRequiredData.length;

  useEffect(() => {
    if (!templateColumns || !fileData) return;

    const missing: { row: number; columns: string[] }[] = [];
    fileData.forEach((row, index) => {
      const missingColumns: string[] = [];

      Object.entries(templateColumns).forEach(([columnName, config]) => {
        if (
          convertRequiredField(config.required) &&
          (!row[columnName] || row[columnName].trim() === "")
        ) {
          missingColumns.push(columnName);
        }
      });

      if (missingColumns.length > 0) {
        missing.push({ row: index + 1, columns: missingColumns });
      }
    });

    setMissingRequiredData(missing);
  }, [fileData, templateColumns]);

  // Create columns based on the data
  const columns = useMemo<ColumnDef<unknown, unknown>[]>(() => {
    if (fileData.length === 0) return [];

    return Object.keys(fileData[0]).map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ row, column }) => {
        const cellId = `${row.index}-${column.id}`;
        const originalValue = originalData[row.index]?.[key];

        const isEdited =
          originalData[row.index]?.[key] !== fileData[row.index]?.[key];
        const isRequired = convertRequiredField(
          templateColumns?.[key]?.required
        );
        const isEmpty =
          !fileData[row.index][key] ||
          (typeof fileData[row.index][key] === "string" &&
            fileData[row.index][key].trim() === "");
        const isInvalid = isRequired && isEmpty;

        return (
          <div>
            <div className="group relative" data-edited="false">
              <Input
                value={fileData[row.index][key] || ""}
                onChange={(e) => {
                  const newData = [...fileData];
                  newData[row.index][key] = e.target.value;
                  setFileEditedData(newData);

                  const parentElement = e.target.parentElement;

                  if (e.target.value !== originalValue) {
                    setEditedCells((prev) => ({ ...prev, [cellId]: true }));
                    // parentElement.setAttribute("data-edited", "true");
                    if (parentElement?.className)
                      parentElement.className = "h-8 w-full border-amber-400";
                  } else {
                    setEditedCells((prev) => {
                      const newEdited = { ...prev };
                      delete newEdited[cellId];
                      return newEdited;
                    });
                    // parentElement.removeAttribute("data-edited");
                    if (parentElement?.className)
                      parentElement.className = "h-8 w-full";
                  }

                  if (onDataReviewed) {
                    onDataReviewed(newData);
                  }
                }}
                className={`h-8 w-full ${isEdited ? "border-amber-400 " : ""} ${
                  isInvalid ? "border-red-400 " : ""
                }`}
              />
              {/* <Badge
                variant="outline"
                className="absolute -top-2 -right-2 bg-amber-100 text-amber-800 border-amber-300 text-[10px] px-1 hidden group-data-[edited=true]:block"
              >
                Edited
              </Badge> */}
            </div>
          </div>
        );
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, templateColumns]);

  const memoizedTableData = useMemo(() => fileData, [fileData]);

  const table = useReactTable({
    data: memoizedTableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: { pagination },
    // onPaginationChange: setPagination,
  });

  const editedRowCount =
    Object.keys(editedCells).length > 0
      ? new Set(Object.keys(editedCells).map((key) => key.split("-")[0])).size
      : 0;

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Review Data</h2>
        <div className="flex gap-2">
          {editedRowCount > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-800 border-amber-300"
            >
              {editedRowCount} row{editedRowCount !== 1 ? "s" : ""} edited
            </Badge>
          )}
          {missingFieldsCount > 0 && (
            <div className="relative group">
              <Badge
                variant="outline"
                className="bg-red-100 text-red-800 border-red-300"
              >
                {missingFieldsCount} row{missingFieldsCount !== 1 ? "s" : ""}{" "}
                missing data
              </Badge>
              <div className="absolute z-50 hidden group-hover:block right-0 mt-2 w-64 p-2 bg-white border rounded-md shadow-lg">
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Missing Required Fields:</p>
                  <ul className="list-disc pl-4">
                    {missingRequiredData.slice(0, 3).map(({ row, columns }) => (
                      <li key={row} className="text-xs">
                        Row {row}: {columns.join(", ")}
                      </li>
                    ))}
                    {missingRequiredData.length > 3 && (
                      <li className="text-xs text-gray-500">
                        ...and {missingRequiredData.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0 overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto max-h-[300px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            colSpan={header.colSpan}
                            style={{
                              position: "relative",
                              width: header.getSize(),
                              minWidth: header.getSize(),
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            {header.column.getCanResize() && (
                              <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className={` absolute right-0 top-0 h-full w-1 bg-secondary cursor-col-resize select-none touch-none ${
                                  header.column.getIsResizing()
                                    ? "isResizing"
                                    : ""
                                }`}
                              ></div>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className="p-1"
                              style={{ width: cell.column.getSize() }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Rows per page:
                  </span>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => {
                      setPagination((prev) => ({
                        ...prev,
                        pageSize: Number(e.target.value),
                      }));
                    }}
                    className="h-8 w-20 rounded-md border border-input bg-background px-2"
                  >
                    {pageSizeOptions.map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  {table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    fileData.length
                  )}{" "}
                  of {fileData.length} entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      // table.previousPage();
                      setPagination((prev) => ({
                        ...prev,
                        pageIndex: prev.pageIndex - 1,
                      }));
                    }}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      //   table.nextPage();
                      setPagination((prev) => ({
                        ...prev,
                        pageIndex: prev.pageIndex + 1,
                      }));
                    }}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
