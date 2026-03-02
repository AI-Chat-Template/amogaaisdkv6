"use client";

import { SlidersHorizontal } from "lucide-react";
import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";

interface DataTableViewOptionsProps<TData> {
  views: {
    value: string;
    label: string;
  }[];
  view: string;
  setView: React.Dispatch<React.SetStateAction<string>>;
}

export function DataTableViewOptions<TData>({
  views,
  view,
  setView,
}: DataTableViewOptionsProps<TData>) {
  return (
    <Select onValueChange={setView} defaultValue={view}>
      <SelectTrigger className="ml-auto h-8 gap-1 md:gap-2 focus:outline-none focus:ring-1 focus:ring-ring focus-visible:ring-0">
        <SlidersHorizontal className="size-4" />
        <span className="hidden sm:block">View</span>
      </SelectTrigger>
      <SelectContent>
        {views.map((v) => {
          return (
            <SelectItem key={v.value} value={v.value}>
              <span className="truncate">{v.label}</span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
