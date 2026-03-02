import type { SearchParams } from "@/types";
import * as React from "react";

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Shell } from "@/components/shell";
import { getValidFilters } from "@/lib/data-table";

import { FeatureFlagsProvider } from "./_components/feature-flags-provider";
import { UsersTable } from "./_components/table";
import { getStoreUsers } from "./_lib/queries";
import { searchParamsCache } from "./_lib/validations";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store Users",
  description: "Manage your users",
};

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function IndexPage(props: IndexPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);

  const validFilters = getValidFilters(search.filters);

  const promises = Promise.all([
    getStoreUsers({
      page: search.page,
      perPage: search.perPage,
      search: search.query,
      sort: search.sort,
      roles: search.role,
      filters: validFilters,
      flags: search.flags,
    }),
  ]);

  return (
    <Shell className="gap-2">
      <div className="pb-2">
        <p className="text-muted-foreground">
          Manage your users
        </p>
      </div>
      <FeatureFlagsProvider>
        <React.Suspense
          fallback={
            <DataTableSkeleton
              columnCount={5}
              searchableColumnCount={1}
              filterableColumnCount={2}
              cellWidths={["6rem", "20rem", "20rem", "12rem", "12rem"]}
              shrinkZero
            />
          }
        >
          <UsersTable promises={promises} />
        </React.Suspense>
      </FeatureFlagsProvider>
    </Shell>
  );
}
