import React from "react";
import { DataUpload } from "../type";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { format } from "date-fns";
import { flexRender, Table } from "@tanstack/react-table";

interface RecordsCardProps {
  records: DataUpload[];
  table: Table<DataUpload>;
}

export function CardsView({ records, table }: RecordsCardProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {records.map((record) => {
        const actionCell = table
          .getRowModel()
          .rowsById[record.data_upload_uuid ?? ""].getAllCells()
          .find((cell) => cell.column.id === "actions");
        return (
          <Card key={record?.data_upload_uuid} className="w-full rounded-md relative">
            <CardHeader>
              <CardTitle>{record?.file_name || "Untitled Document"}</CardTitle>
              <CardDescription>Status: {record?.status}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>ID: {record?.data_upload_uuid}</p>
              <p>
                Created:{" "}
                {record?.created_date && format(record?.created_date, "PPP")}
              </p>
              {record?.updated_date && (
                <p>Updated: {format(record?.updated_date, "PPP")}</p>
              )}
              {record?.file_url && (
                <p>
                  Share URL: <a href={record?.file_url}>view</a>
                </p>
              )}
            </CardContent>
            <div className="absolute right-0 bottom-0">
              {actionCell
                ? flexRender(
                    actionCell.column.columnDef.cell,
                    actionCell.getContext()
                  )
                : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
