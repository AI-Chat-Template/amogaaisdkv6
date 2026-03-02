"use client";

import { CustomerReport } from "../type";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Ellipsis } from "lucide-react";
import { DataTableRowAction } from "@/types";

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<CustomerReport> | null>
  >;
}

export function getColumns({
  setRowAction,
}: GetColumnsProps): ColumnDef<CustomerReport>[] {
  return [
    // {
    //   id: "select",
    //   maxSize: 28,
    //   header: ({ table }) => (
    //     <Checkbox
    //       checked={
    //         table.getIsAllPageRowsSelected() ||
    //         (table.getIsSomePageRowsSelected() && "indeterminate")
    //       }
    //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //       aria-label="Select all"
    //       className="translate-y-0.5"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <Checkbox
    //       checked={row.getIsSelected()}
    //       onCheckedChange={(value) => row.toggleSelected(!!value)}
    //       aria-label="Select row"
    //       className="translate-y-0.5"
    //     />
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    {
      accessorKey: "username",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Username" />
      ),
    },
    {
      accessorKey: "date_last_active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last active" />
      ),
      cell: ({ row }) =>
        row.original.date_last_active_gmt
          ? new Date(row.original.date_last_active_gmt + "z").toLocaleString()
          : "",
    },
    {
      accessorKey: "date_registered",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date registered" />
      ),
      cell: ({ row }) =>
        row.original.date_registered_gmt
          ? new Date(row.original.date_registered_gmt + "z").toLocaleString()
          : "",
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      accessorKey: "orders_count",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Orders count" />
      ),
      cell: ({ row }) => row.original.orders_count,
    },
    {
      accessorKey: "total_spent",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Spent" />
      ),
      cell: ({ row }) => row.original.total_spend,
    },
    {
      accessorKey: "avg_order_value",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="AOV" />
      ),
      cell: ({ row }) => row.original.avg_order_value,
    },
    {
      accessorKey: "country",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Country" />
      ),
      cell: ({ row }) => row.original.country,
    },
    {
      accessorKey: "city",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="City" />
      ),
      cell: ({ row }) => row.original.city,
    },
    {
      accessorKey: "state",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="State" />
      ),
      cell: ({ row }) => row.original.state,
    },
    {
      accessorKey: "postcode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Post Code" />
      ),
      cell: ({ row }) => row.original.postcode,
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [isUpdatePending, startUpdateTransition] = React.useTransition();

        return row.original.user_id ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open menu"
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, type: "update" })}
              >
                Edit
              </DropdownMenuItem>
              {/* <DropdownMenuSub>
                <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={row.original.product_name || ""}
                    onValueChange={(value) => {
                      startUpdateTransition(() => {
                        toast.promise(
                          quickUpdateRecord({
                            id: row.original.id,
                            role: value as UserRole,
                          }).then((data) => {
                            if (data.error) throw data.error;
                            return { ...data };
                          }),
                          {
                            loading: "Updating...",
                            success: "Status updated",
                            error: (err) => err,
                          }
                        );
                      });
                    }}
                  >
                    {UserRoles.map((role) => (
                      <DropdownMenuRadioItem
                        key={role}
                        value={role}
                        className="capitalize"
                        disabled={isUpdatePending}
                      >
                        {role}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, type: "delete" })}
              >
                Delete
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <></>
        );
      },
      size: 40,
    },
  ];
}
