"use client";

import type {
  DataTableAdvancedFilterField,
  DataTableFilterField,
} from "@/types";
import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";

import type { getRecords } from "../_lib/queries";
import { useFeatureFlags } from "./feature-flags-provider";
import { getColumns } from "./table-columns";
import { RecordsTableFloatingBar } from "./table-floating-bar";
import { RecordsTableToolbarActions } from "./table-toolbar-actions";
import { Table } from "@tanstack/react-table";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";

interface DataRow {
  [key: string]: string | number | boolean | null;
}

interface RecordsTableProps {
  promises: Promise<[Awaited<ReturnType<typeof getRecords>>]>;
  templateFields: string[];
  validFilters: object[];
  searchParams: object;
  tableName: string;
  dataUploadUUID: string;
}

interface ViewOption {
  value: string;
  label: string;
  component: React.ComponentType<{
    records: DataRow[];
    table: Table<DataRow>;
  }> | null;
}

export function RecordsTable({
  promises,
  templateFields,
  validFilters,
  searchParams,
  tableName,
  dataUploadUUID,
}: RecordsTableProps) {
  const { featureFlags } = useFeatureFlags();

  const [{ data, pageCount }] = React.use(promises);

  const columns = React.useMemo(
    () => getColumns({ templateFields }),
    [templateFields]
  );

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
  const filterFields: DataTableFilterField<DataRow>[] = [
    {
      id: "search",
      label: "search",
      placeholder: "Search...",
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
  const advancedFilterFields: DataTableAdvancedFilterField<DataRow>[] =
    React.useMemo(
      () =>
        templateFields.map((field) => ({
          id: field,
          label: field,
          type: "text",
        })),
      [templateFields]
    );

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
    getRowId: (originalRow, index: number) =>
      index.toString() || originalRow.data_upload_uuid,
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
      // { value: "card", label: "Card View", component: CardsView },
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
              </>
            }
          >
            <RecordsTableToolbarActions
              table={table}
              validFilters={validFilters}
              searchParams={searchParams}
              tableName={tableName}
              dataUploadUUID={dataUploadUUID}
              templateFields={templateFields}
            />
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
              </>
            }
          >
            <RecordsTableToolbarActions
              table={table}
              validFilters={validFilters}
              searchParams={searchParams}
              tableName={tableName}
              dataUploadUUID={dataUploadUUID}
              templateFields={templateFields}
            />
          </DataTableToolbar>
        )}
      </DataTable>
    </>
  );
}
