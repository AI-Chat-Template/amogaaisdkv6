"use client";

import type { Table } from "@tanstack/react-table";
import { Download, SendToBackIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportAllRecordsToCSV, exportTableToCSV } from "@/lib/export";
import Link from "next/link";
import { getAllFilteredRecords } from "../_lib/queries";

interface DataRow {
  [key: string]: string | number | boolean | null;
}

interface RecordsTableToolbarActionsProps {
  table: Table<DataRow>;
  validFilters: object[];
  searchParams: object;
  tableName: string;
  dataUploadUUID: string;
  templateFields: string[];
}

export function RecordsTableToolbarActions({
  table,
  validFilters,
  searchParams,
  tableName,
  dataUploadUUID,
  templateFields,
}: RecordsTableToolbarActionsProps) {
  const getData = async () => {
    const data = await getAllFilteredRecords({
      ...searchParams,
      filters: validFilters,
      tableName: tableName,
      dataUploadUuid: dataUploadUUID,
      templateFields: templateFields,
    });
    return data;
  };
  return (
    <div className="flex items-center gap-2">
      <Link href={"/dataupload"}>
        <Button variant="outline" size="sm" className="gap-2">
          <SendToBackIcon className="size-4" aria-hidden="true" />
          <span className="hidden sm:block">Back to Data uploads</span>
        </Button>
      </Link>

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportTableToCSV(table, {
            filename: "data_upload",
            excludeColumns: ["select", "actions", "search"],
          })
        }
        className="gap-2"
      >
        <Download className="size-4" aria-hidden="true" />
        <span className="hidden sm:block">Export</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportAllRecordsToCSV(
            table,
            getData,
            {
              filename: "all_filtred_records" + tableName,
            },
            ["select", "search", "actions"]
          )
        }
        className="gap-2"
      >
        <Download className="size-4" aria-hidden="true" />
        <span className="hidden sm:block">Export All</span>
      </Button>
    </div>
  );
}
