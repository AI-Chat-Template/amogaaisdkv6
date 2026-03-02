import type { SearchParams } from "@/types";
import * as React from "react";

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Shell } from "@/components/shell";
import { getValidFilters } from "@/lib/data-table";

import { FeatureFlagsProvider } from "./_components/feature-flags-provider";
import { RecordsTable } from "./_components/table";
import { getRecords } from "./_lib/queries";
import { searchParamsCache } from "./_lib/validations";
import { postgrest } from "@/lib/postgrest";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Uploads",
  description: "view your data",
};

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
  params: Promise<{ id: string }>;
}

export default async function IndexPage(props: IndexPageProps) {
  const params = await props.params;
  if (!params.id) {
    return <div>Invalid ID</div>;
  }

  const { data, error } = await postgrest
    .from("data_upload")
    .select(
      "data_upload_uuid, template_name, template_id, data_table_name"
    )
    .eq("data_upload_uuid", params.id)
    .single();

  if (error || !data) {
    console.error("Error fetching data upload:", error);
    return <div>Error fetching data upload</div>;
  }

  if (!data.template_id) {
    return <div>Template ID is missing</div>;
  }

  if (!data.data_table_name) {
    return <div>Data table name is missing</div>;
  }

  if (!data.data_upload_uuid) {
    return <div>Data table name is missing</div>;
  }

  const { data: templateData, error: templateError } = await postgrest
    .from("data_upload_setup")
    .select("data_upload_setup_id, template_file_fields_json")
    .eq("data_upload_setup_id", data.template_id)
    .single();

  if (templateError || !templateData) {
    return <div>Error fetching template data</div>;
  }

  const templateFields = Object.values(
    templateData.template_file_fields_json || {}
  ).map((value: { field_name: string }) => value.field_name);

  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);

  const validFilters = getValidFilters(search.filters);

  const promises = Promise.all([
    getRecords({
      ...search,
      filters: validFilters,
      tableName: data.data_table_name,
      dataUploadUuid: data.data_upload_uuid,
      templateFields: templateFields,
    }),
  ]);

  return (
    <Shell className="gap-2">
      <div className="pb-2">
        <p className="text-muted-foreground">view the uploaded data</p>
      </div>
      <FeatureFlagsProvider>
        <React.Suspense
          fallback={
            <DataTableSkeleton
              columnCount={4}
              searchableColumnCount={1}
              filterableColumnCount={2}
              cellWidths={["10rem", "40rem", "12rem", "12rem", "8rem", "8rem"]}
              shrinkZero
            />
          }
        >
          <RecordsTable
            promises={promises}
            templateFields={templateFields}
            validFilters={validFilters}
            searchParams={search}
            tableName={data.data_table_name}
            dataUploadUUID={data.data_upload_uuid}
          />
        </React.Suspense>
      </FeatureFlagsProvider>
    </Shell>
  );
}
