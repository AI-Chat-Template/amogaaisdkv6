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
import { fallbackImage } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

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
            <CardHeader className="flex items-start space-x-4">
              <div>
                <CardTitle>
                  {record?.first_name} {record?.last_name}
                </CardTitle>
                <CardDescription>Status: {record?.status}</CardDescription>
              </div>
            </CardHeader>

            {/* Profile image positioned at the top-right */}
            <div className="absolute top-1 right-4 p-2">
              <Avatar className="size-16 border-2 border-gray-300">
                <AvatarImage src={record?.profile_pic_url || fallbackImage} />
              </Avatar>
            </div>

            <CardContent>
              <p>ID: {record?.user_catalog_id}</p>
              <p>
                Created:{" "}
                {record?.created_datetime &&
                  format(record?.created_datetime, "PPP")}
              </p>
              <p>Business: {record?.business}</p>
            </CardContent>

            <div className="absolute right-0 bottom-0 p-4">
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
