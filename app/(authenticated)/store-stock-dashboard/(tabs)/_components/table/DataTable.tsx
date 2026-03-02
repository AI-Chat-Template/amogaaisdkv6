"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { parseAsString, useQueryState } from "nuqs";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  search: string;
  perPage: number;
  page: number;
  stockStatus: string[];
  onSearch: (value: string) => void;
  onPerPage: (value: number) => void;
  onPage: (value: number) => void;
  onStockStatus: (values: string[]) => void;
  totalPages?: number;
  stockStatusState?: Record<string, number>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  setActiveTab,
  search,
  perPage,
  page,
  stockStatus,
  onSearch,
  onPerPage,
  onPage,
  onStockStatus,
  totalPages,
  stockStatusState = {},
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [orderby, setOrderBy] = useQueryState(
    "order_by",
    parseAsString.withDefault("stock_status").withOptions({ shallow: false })
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [order, setOrder] = useQueryState(
    "order",
    parseAsString.withDefault("asc").withOptions({ shallow: false })
  );

  React.useEffect(() => {
    console.log("sorting", sorting);
  }, [sorting]);
  const table = useReactTable({
    data,
    columns,
    meta: {
      setTab: setActiveTab,
    },
    manualPagination: true,
    pageCount: totalPages,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter: search,
      pagination: {
        pageSize: perPage,
        pageIndex: page - 1,
      },
    },
    manualSorting: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    // onSortingChange: (v) => {
    //   const updateValue = v(sorting);
    //   setSorting(v);
    //   console.log("sorting11", v);
    //   const sortingArr = v ?? [];
    //   if (sortingArr.length > 0) {
    //     console.log("sorting222", sortingArr.length, sortingArr[0]);
    //     const { id, desc } = sortingArr[0];
    //     setOrderBy(id);
    //     setOrder(desc ? "desc" : "asc");
    //   }
    // },
    onSortingChange: (updater) => {
      const newSortingValue =
        updater instanceof Function ? updater(sorting) : updater;
      const sortingArr = Array.isArray(newSortingValue) ? newSortingValue : [];
      if (sortingArr.length > 0) {
        const { id, desc } = sortingArr[0];
        setOrderBy(id);
        setOrder(desc ? "desc" : "asc");
      }
      setSorting(updater); //normal state update
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onGlobalFilterChange: onSearch,
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar
        search={search}
        onSearch={onSearch}
        stockStatus={stockStatus}
        onStockStatus={onStockStatus}
        table={table}
        stockStatusState={stockStatusState}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table?.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        page={page}
        onPage={onPage}
        onPerPage={onPerPage}
        table={table}
      />
    </div>
  );
}
