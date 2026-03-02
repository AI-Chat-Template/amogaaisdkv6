"use client";

import { ColumnDef } from "@tanstack/react-table";
import { stock_status } from "./data/data";
import { DataTableColumnHeader } from "./table/data-table-column-header";

export const columns: ColumnDef<unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="name" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("name")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "stock_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="stock status" />
    ),
    cell: ({ row }) => {
      const stat = stock_status.find(
        (status) => status.value === row.getValue("stock_status")
      );

      if (!stat) {
        return null;
      }

      return (
        <div className="flex w-[100px] items-center">
          <span>{stat.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="sku" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("sku")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "stock_quantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="stock quantity" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("stock_quantity")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "low_stock_amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="low stock amount" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("low_stock_amount")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "manage_stock",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="manage stock" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("manage_stock")? "true" : "false"}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
];
