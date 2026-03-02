import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { flexRender, Table } from "@tanstack/react-table";
import { UserType } from "../type";

interface RecordsCardProps {
  records: UserType[];
  table: Table<UserType>;
}

export function CardsView({ records, table }: RecordsCardProps) {
  const getActionCell = React.useCallback(
    (recordId: string) => {
      return table
        .getRowModel()
        .rowsById[recordId]?.getAllCells()
        .find((cell) => cell.column.id === "actions");
    },
    [table]
  );

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {records.map((user) => {
        const actionCell = getActionCell(user.id?.toString() ?? "");

        return (
          <Card key={user?.id} className="w-full rounded-md relative">
            <CardHeader>
              <CardTitle>{user.name}</CardTitle>
              <CardDescription>Username: {user.username}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>ID: {user.id}</p>
              <p>Email: {user.email}</p>
              <p>Roles: {user.role}</p>
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
