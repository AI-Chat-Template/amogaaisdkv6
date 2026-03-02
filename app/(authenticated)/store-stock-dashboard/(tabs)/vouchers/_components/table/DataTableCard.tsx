/* eslint-disable */
import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  totalPages?: number;
}

export function CardDataTable<TData, TValue>({
  columns,
  data,
  setActiveTab,
  totalPages = 0,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  React.useEffect(() => {
    console.log("paggg", pagination);
  }, [pagination]);

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

  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({ shallow: false })
  );
  const [globalFilter, setGlobalFilter] = React.useState(search);

  const [perPage, setPerPage] = useQueryState(
    "per_page",
    parseAsInteger.withDefault(10).withOptions({ shallow: false })
  );

  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );

  React.useEffect(() => {
    console.log("columnFilters", columnFilters);
  }, [columnFilters]);

  const table = useReactTable({
    data,
    columns,
    meta: {
      setTab: setActiveTab,
    },
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex: page,
        pageSize: perPage,
      },
      globalFilter,
    },
    // manualFiltering: true,
    // globalFilterFn: (row, columnId, filterValue) => {
    //   console.log("globalFilterFn", row, columnId, filterValue);
    //   const value = row.getValue(columnId);
    //   return (
    //     String(value).toLowerCase().includes(String(filterValue).toLowerCase())
    //   );
    // },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    manualSorting: true,
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
    manualPagination: true,
    pageCount: totalPages,
    onPaginationChange: (updater) => {
      setPagination(updater);
      setPagination((old) => {
        const newPageValue =
          updater instanceof Function
            ? updater({ pageIndex: old.pageIndex, pageSize: perPage })
            : updater;
        console.log("newPageValue.pageIndex", newPageValue);
        console.log("newPageValue.pageIndex old", old);
        // const newPage = newPageValue.page ?? 1;
        setPage(newPageValue.pageIndex); // pageIndex is zero-based
        setPerPage(newPageValue.pageSize ?? perPage);
        return {
          pageIndex: newPageValue.pageIndex,
          pageSize: newPageValue.pageSize ?? perPage,
        };
      });
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    // Add onGlobalFilterChange to update search param
    onGlobalFilterChange: (filter) => {
      setGlobalFilter(filter);
      setSearch(filter || "");
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} viewContoller={false} />
      <div className="flex flex-wrap">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            var row_data = row.getVisibleCells();

            if (
              !Array.isArray(data) &&
              row_data.length > 0 &&
              !row_data[0]?.row?.original
            )
              return (
                <div key={row.id} className="hidden">
                  {" "}
                </div>
              );

            return (
              <div
                key={row.id}
                style={{ border: "0px" }}
                className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 mb-3 md:px-2"
              >
                {/* Render card component */}
                <CardComponent card_data={row_data[0].row.original} />
              </div>
            );
          })
        ) : (
          <h1 className="h-24 text-center">No results.</h1>
        )}
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}

const CardComponent: React.FC<{ card_data: any }> = ({ card_data }) => {
  // console.log("card_data", card_data);
  return (
    <Card className="flex flex-col h-full relative">
      <CardContent className="p-4 flex flex-col">
        <CardTitle className="text-base font-semibold">
          {card_data.name}
        </CardTitle>
        <div className="space-y-1">
          <p className="text-sm ">group: {card_data.voucher_group}</p>
          <p className="text-sm ">category: {card_data.voucher_category}</p>
          <p className="text-sm ">narration: {card_data.voucher_narration}</p>
          <p className="text-sm ">number: {card_data.voucher_number}</p>
          <p className="text-sm ">ref_voucher_no: {card_data.ref_voucher_no}</p>
          <p className="text-sm ">status: {card_data.voucher_status}</p>
          <p className="text-sm ">ref order no: {card_data.ref_order_no}</p>
          <p className="text-sm ">for order no: {card_data.for_order_no}</p>
          <p className="text-sm ">order date: {card_data.order_date}</p>
          <p className="text-sm ">
            purchase order no: {card_data.purchase_order_no}
          </p>
          <p className="text-sm ">
            ref purchase order no: {card_data.ref_purchase_order_no}
          </p>
          <p className="text-sm ">
            purchase order date: {card_data.purchase_order_date}
          </p>
          <p className="text-sm ">
            returnable status: {card_data.returnable_status}
          </p>
          <p className="text-sm ">
            from business name: {card_data.from_business_name}
          </p>
          <p className="text-sm ">
            to business name: {card_data.to_business_name}
          </p>
          <p className="text-sm ">
            for business name: {card_data.for_business_name}
          </p>
          <p className="text-sm ">
            {new Date(card_data.datetime).toDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
