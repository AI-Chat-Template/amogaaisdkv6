"use client";

import { type RoleList, roleListStatuses } from "../type";
import type {
  DataTableAdvancedFilterField,
  DataTableFilterField,
  DataTableRowAction,
} from "@/types";
import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { toSentenceCase } from "@/lib/utils";

import type { getDocumentCountByField, getRecords } from "../_lib/queries";
import { getStatusIcon } from "../_lib/utils";
import { DeleteRecordsDialog } from "./delete-dialog";
import { useFeatureFlags } from "./feature-flags-provider";
import { getColumns } from "./table-columns";
import { RecordsTableFloatingBar } from "./table-floating-bar";
import { RecordsTableToolbarActions } from "./table-toolbar-actions";
import { UpdateRecordSheet } from "./update-sheet";
import { Button } from "@/components/ui/button";
import { Row, Table } from "@tanstack/react-table";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { CardsView } from "./view-cards";
import { Plus } from "lucide-react";

interface RecordsTableProps {
  promises: Promise<
    [
      Awaited<ReturnType<typeof getRecords>>,
      Awaited<ReturnType<typeof getDocumentCountByField>>
    ]
  >;
}

interface ViewOption {
  value: string;
  label: string;
  component: React.ComponentType<{
    records: RoleList[];
    table: Table<RoleList>;
  }> | null;
}

export function RecordsTable({ promises }: RecordsTableProps) {
  const { featureFlags } = useFeatureFlags();

  const [{ data, pageCount }, statusCounts] = React.use(promises);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<RoleList> | null>(null);

  const columns = React.useMemo(() => getColumns({ setRowAction }), []);

  /**
   * This component can render either a faceted filter or a search filter based on the `options` prop.
   *
   * @prop options - An array of objects, each representing a filter option. If provided, a faceted filter is rendered. If not, a search filter is rendered.
   *
   * Each `option` object has the following properties:
   * @prop {string} label - The label for the filter option.
   * @prop {string} value - The value for the filter option.
   * @prop {React.ReactNode} [icon] - An optional icon to display next to the label.
   * @prop {boolean} [withCount] - An optional boolean to display the count of the filter option.
   */
  const filterFields: DataTableFilterField<RoleList>[] = [
    {
      id: "status",
      label: "Status",
      options: roleListStatuses.map((status) => ({
        label: toSentenceCase(status),
        value: status,
        icon: getStatusIcon(status),
        count: statusCounts[status] || 0, // Ensure undefined values are handled
      })),
    },
  ];

  /**
   * Advanced filter fields for the data table.
   * These fields provide more complex filtering options compared to the regular filterFields.
   *
   * Key differences from regular filterFields:
   * 1. More field types: Includes 'text', 'multi-select', 'date', and 'boolean'.
   * 2. Enhanced flexibility: Allows for more precise and varied filtering options.
   * 3. Used with DataTableAdvancedToolbar: Enables a more sophisticated filtering UI.
   * 4. Date and boolean types: Adds support for filtering by date ranges and boolean values.
   */
  const advancedFilterFields: DataTableAdvancedFilterField<RoleList>[] = [
    {
      id: "status",
      label: "Status",
      type: "multi-select",
      options: roleListStatuses.map((status) => ({
        label: toSentenceCase(status),
        value: status,
        icon: getStatusIcon(status),
        count: statusCounts[status] || 0, // Ensure undefined values are handled
      })),
    },
    {
      id: "created_date",
      label: "Date",
      type: "date",
    },
  ];

  const enableAdvancedTable = featureFlags.includes("advancedTable");
  const enableFloatingBar = featureFlags.includes("floatingBar");

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    filterFields,
    enableAdvancedFilter: enableAdvancedTable,
    initialState: {
      sorting: [{ id: "created_date", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow.role_list_id?.toString(),
    shallow: false,
    clearOnDefault: true,
  });

  const isMobile = useIsMobile();
  const [view, setView] = React.useState<string>(() => {
    return isMobile ? "card" : "table";
  });

  const viewOptions: ViewOption[] = React.useMemo(
    () => [
      { value: "table", label: "Table View", component: null },
      { value: "card", label: "Card View", component: CardsView },
    ],
    []
  );

  const selectedViewOption = React.useMemo(() => {
    return (
      viewOptions.find((option) => option.value === view) || viewOptions[0]
    );
  }, [view, viewOptions]);

  return (
    <>
      <DataTable
        table={table}
        floatingBar={
          enableFloatingBar ? <RecordsTableFloatingBar table={table} /> : null
        }
        viewComponent={
          selectedViewOption?.component !== null ? (
            <selectedViewOption.component records={data} table={table} />
          ) : null
        }
      >
        {enableAdvancedTable ? (
          <DataTableAdvancedToolbar
            table={table}
            filterFields={advancedFilterFields}
            shallow={false}
            showColumnVisibilitySelect={selectedViewOption?.value === "table"}
            endContent={
              <>
                <DataTableViewOptions
                  views={viewOptions}
                  view={view}
                  setView={setView}
                />
                <Button
                  size="sm"
                  onClick={() =>
                    setRowAction({ row: {} as Row<RoleList>, type: "new" })
                  }
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:block">Add</span>
                </Button>
              </>
            }
          >
            <RecordsTableToolbarActions table={table} />
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar
            table={table}
            filterFields={filterFields}
            showColumnVisibilitySelect={selectedViewOption?.value === "table"}
            endContent={
              <>
                <DataTableViewOptions
                  views={viewOptions}
                  view={view}
                  setView={setView}
                />
                <Button
                  size="sm"
                  onClick={() =>
                    setRowAction({ row: {} as Row<RoleList>, type: "new" })
                  }
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:block">Add</span>
                </Button>
              </>
            }
          >
            <RecordsTableToolbarActions table={table} />
          </DataTableToolbar>
        )}
      </DataTable>

      <UpdateRecordSheet
        open={rowAction?.type === "update" || rowAction?.type === "new"}
        isNew={rowAction?.type === "new"}
        onOpenChange={() => setRowAction(null)}
        record={rowAction?.row.original ?? null}
      />
      <DeleteRecordsDialog
        open={rowAction?.type === "delete"}
        onOpenChange={() => setRowAction(null)}
        records={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
    </>
  );
}
