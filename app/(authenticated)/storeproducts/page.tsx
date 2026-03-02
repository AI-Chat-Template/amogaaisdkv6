import type { SearchParams } from "@/types";
import * as React from "react";

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Shell } from "@/components/shell";
import { getValidFilters } from "@/lib/data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { FeatureFlagsProvider } from "./_components/feature-flags-provider";
import { UsersTable } from "./_components/table";
import { getStoreProducts } from "./_lib/queries";
import { searchParamsCache } from "./_lib/validations";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store products",
  description: "Manage your users",
};

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function IndexPage(props: IndexPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);

  const validFilters = getValidFilters(search.filters);

  const result = await getStoreProducts({
    page: search.page,
    perPage: search.perPage,
    search: search.query,
    sort: search.sort,
    filters: validFilters,
    flags: search.flags,
    status: search.status,
  });

  // Check if WooCommerce is not configured
  if (!result.isConfigured) {
    return (
      <Shell className="gap-2">
        <div className="pb-2">
          <p className="text-muted-foreground">Manage your products</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-amber-100 p-4 mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-amber-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No WooCommerce Configuration</h3>
          <p className="text-muted-foreground max-w-md">
            {result.error || "Please configure your WooCommerce settings in Business Settings to view and manage products."}
          </p>
          <Link 
            href="/settings"
            className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Go to Settings
          </Link>
        </div>
      </Shell>
    );
  }

  const promises = Promise.all([
    Promise.resolve(result),
  ]);

  return (
    <Shell className="gap-2">
      <div className="pb-2">
        <p className="text-muted-foreground">Manage your products</p>
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
