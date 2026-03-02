"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DataTableViewOptions } from "./data-table-view-options";
import { stock_status } from "../data/data";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  viewContoller?: boolean;
  search: string;
  onSearch: (value: string) => void;
  stockStatus: string[];
  onStockStatus: (values: string[]) => void;
  stockStatusState?: Record<string, number>;
}

export function DataTableToolbar<TData>({
  table,
  viewContoller = true,
  onSearch,
  stockStatus,
  onStockStatus,
  stockStatusState = {},
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* <Input
          placeholder="Type to search ..."
          // value={(table.getState()?.globalFilter as string) ?? ""}
          // onChange={(event) => {
          //   // table.getColumn("first_name")?.setFilterValue(event.target.value)
          //   table.setGlobalFilter(event.target.value);
          // }}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        /> */}

        {table.getColumn("stock_status") && (
          <>
            <Select
              onValueChange={(value) => {
                onStockStatus(value ? [value] : []);
              }}
              value={stockStatus.length > 0 ? stockStatus[0] : ""}
            >
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Select a Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {stock_status.map((option) => {
                    return (
                      <SelectItem value={option.value} key={option.value}>
                        <div className="flex items-center space-x-2">
                          <span>{option.label}</span>
                          {stockStatusState[option.value] !== undefined && (
                            <span className="ml-2 text-xs text-gray-500">
                              {stockStatusState[option.value]
                                ? stockStatusState[option.value]
                                : 0}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
            {/* <DataTableFacetedFilter
              column={table.getColumn("stock_status")}
              title="stock_status"
              options={stock_status}
              multi={false}
              onChange={(values) => onStockStatus(values)}
            /> */}
          </>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
              onSearch("");
              onStockStatus([]);
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {viewContoller && <DataTableViewOptions table={table} />}
    </div>
  );
}
