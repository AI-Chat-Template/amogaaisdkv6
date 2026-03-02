"use client";

import { parseAsString, useQueryStates } from "nuqs";
import * as React from "react";
import { Input } from "@/components/ui/input";

export function SearchInput({ shallow = true }: { shallow?: boolean }) {
  const [searchParams, setSearchParams] = useQueryStates(
    {
      query: parseAsString.withDefault(""),
    },
    {
      clearOnDefault: true,
      shallow,
    }
  );

  return (
    <Input
      type="text"
      placeholder="Search..."
      value={searchParams.query}
      onChange={(e) => setSearchParams({ query: e.target.value.trim() || "" })}
      className="h-8 w-40 lg:w-64"
    />
  );
}
