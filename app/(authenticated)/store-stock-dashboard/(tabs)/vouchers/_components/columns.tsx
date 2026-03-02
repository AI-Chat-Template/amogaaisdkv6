/* eslint-disable */
"use client";

import { ColumnDef } from "@tanstack/react-table";

import { stock_status } from "./data/data";
import { DataTableColumnHeader } from "./table/data-table-column-header";

export const columns: ColumnDef<unknown>[] = [
  {
    accessorKey: "inventory_voucher_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="voucher id" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("inventory_voucher_id")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "voucher_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="voucher status" />
    ),
    cell: ({ row }) => {
      const stat = stock_status.find(
        (status) => (status as any).value === row.getValue("voucher_status")
      );

      if (!stat) {
        return null;
      }

      return (
        <div className="flex w-[100px] items-center">
          <span>{(stat as any).label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "datetime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Datetime" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("datetime")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "voucher_group",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Voucher Group" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("voucher_group")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "voucher_category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Voucher Category" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("voucher_category")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "voucher_narration",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Voucher Narration" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("voucher_narration")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "voucher_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Voucher Number" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("voucher_number")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "ref_voucher_no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ref Voucher No" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("ref_voucher_no")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "ref_order_no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ref Order No" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("ref_order_no")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "for_order_no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="For Order No" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("for_order_no")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "order_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order Date" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("order_date")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "purchase_order_no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Purchase Order No" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("purchase_order_no")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "ref_purchase_order_no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ref Purchase Order No" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("ref_purchase_order_no")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "purchase_order_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Purchase Order Date" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("purchase_order_date")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "returnable_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Returnable Status" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate font-medium">
        {row.getValue("returnable_status")}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
];
