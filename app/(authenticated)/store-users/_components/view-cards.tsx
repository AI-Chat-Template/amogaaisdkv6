import React from "react";
import { Contact } from "../type";
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
  records: Contact[];
  table: Table<Contact>;
}

export function CardsView({ records, table }: RecordsCardProps) {

  const getActionCell = React.useCallback((recordId: string) => {
    return table
      .getRowModel()
      .rowsById[recordId]?.getAllCells()
      .find((cell) => cell.column.id === "actions");
  }, [table]);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {records.map((record) => {
        const actionCell = getActionCell(record.user_catalog_id?.toString() ?? "");
        return (
          <Card
            key={record?.user_catalog_id}
            className="w-full rounded-md relative"
          >
            <CardHeader>
              <CardTitle>
                {record?.first_name} {record?.last_name}
              </CardTitle>
              <CardDescription>Status: {record?.status}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>ID: {record?.user_catalog_id}</p>
              <p>
                Created:{" "}
                {record?.created_datetime &&
                  format(record?.created_datetime, "PPP")}
              </p>
              {record?.roles_json && (
                <p>
                  Roles: {((record?.roles_json as string[]) || []).join(", ")}
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
