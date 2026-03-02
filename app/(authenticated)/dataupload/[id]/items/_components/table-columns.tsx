"use client";

import type { Column, ColumnDef, Row } from "@tanstack/react-table";
import * as React from "react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";

interface DataRow {
  [key: string]: string | number | boolean | null;
}

interface GetColumnsProps {
  templateFields: string[];
}

export function getColumns({
  templateFields,
}: GetColumnsProps): ColumnDef<DataRow, unknown>[] {
  const dynamicColumns = templateFields.map((field) => ({
    accessorKey: field,
    header: ({ column }: { column: Column<DataRow, unknown> }) => {
      const formattedField = field
        .replace("c_", "")
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return <DataTableColumnHeader column={column} title={formattedField} />;
    },
    cell: ({ row }: { row: Row<DataRow> }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[31.25rem] truncate font-medium">
            {row?.getValue(field)}
          </span>
        </div>
      );
    },
  }));

  return [
    {
      id: "select",
      maxSize: 28,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "search",
      accessorKey: "search",
      header: () => <></>,
      cell: () => <></>,
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
      enableResizing: false,
      size: 0,
      minSize: 0,
      maxSize: 0,
      filterFn: () => true,
    },
    ...dynamicColumns,
  ];
}
