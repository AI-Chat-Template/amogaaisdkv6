"use client";

import type { ProductType } from "../type";
import type { Table } from "@tanstack/react-table";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportTableToCSV } from "@/lib/export";

import { DeleteRecordsDialog } from "./delete-dialog";

interface RecordsTableToolbarActionsProps {
  table: Table<ProductType>;
}

export function RecordsTableToolbarActions({
  table,
}: RecordsTableToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <DeleteRecordsDialog
          records={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSuccess={() => table.toggleAllRowsSelected(false)}
        />
      ) : null}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportTableToCSV(table, {
            filename: "Products",
            excludeColumns: ["select", "actions", "product_small_image_link"],
          })
        }
        className="gap-2"
      >
        <Download className="size-4" aria-hidden="true" />
        <span className="hidden sm:block">Export</span>
      </Button>
      {/**
       * Other actions can be added here.
       * For example, import, view, etc.
       */}
    </div>
  );
}
