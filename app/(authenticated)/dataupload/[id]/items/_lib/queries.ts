// import "server-only";
"use server";
import { postgrest } from "@/lib/postgrest";
import type { GetDataUploadsSchema } from "./validations";
import { filterSupabase } from "@/lib/filter-columns";

function applyFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  input: GetDataUploadsSchema,
  advancedTable: boolean,
  templateFields: string[] = []
) {
  if (advancedTable) {
    const { filters, joinOperator } = filterSupabase({
      filters: input.filters,
      joinOperator: input.joinOperator,
    });

    if (joinOperator === "and") {
      filters.forEach((filter) => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });
    } else {
      const orConditions = filters
        .map((f) => `${f.column}.${f.operator}.${f.value}`)
        .join(",");
      query = query.or(orConditions);
    }
  } else {
    if (input.search) {
      const searchTerm = `%${input.search}%`;
      const searchQuery = templateFields.map(field => `${field}.ilike."${searchTerm}"`).join(',');
      query = query.or(searchQuery);
    }
    if (input.from) {
      query = query.gte("updated_date", new Date(input.from).toISOString());
    }
    if (input.to) {
      query = query.lte("updated_date", new Date(input.to).toISOString());
    }
  }
  return query;
}

export async function getRecords(input: GetDataUploadsSchema) {
  try {
    const { page, perPage, sort, flags, tableName, dataUploadUuid, templateFields } =
      input;
    const offset = (page - 1) * perPage;
    const advancedTable = flags.includes("advancedTable");

    // @ts-expect-error - We are using a custom table name
    let query = postgrest.from(tableName).select("*").eq("data_upload_uuid", dataUploadUuid);

    query = applyFilters(query, input, advancedTable, templateFields);

    // Sorting
    if (sort?.length > 0) {
      sort.forEach((sort) => {
        query = query.order(sort.id, { ascending: !sort.desc });
      });
    } else {
      query = query.order("updated_date", { ascending: true });
    }

    // Pagination
    query = query.range(offset, offset + perPage - 1);

    const { data, error } = await query;
    if (error) throw error;

    // Get total count
    let countQuery = postgrest
      // @ts-expect-error - We are using a custom table name
      .from(tableName)
      .select("data_upload_uuid", { count: "exact", head: true })
      .eq("data_upload_uuid", dataUploadUuid);
    countQuery = applyFilters(countQuery, input, advancedTable, templateFields);

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    const pageCount = Math.ceil((count || 0) / perPage);
    return { data: data, pageCount };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return { data: [], pageCount: 0 };
  }
}

export async function getAllFilteredRecords(input: GetDataUploadsSchema) {
  try {
    const { tableName, dataUploadUuid, templateFields, flags } = input;
    const advancedTable = flags.includes("advancedTable");

    // @ts-expect-error - We are using a custom table name
    let query = postgrest.from(tableName).select("*").eq("data_upload_uuid", dataUploadUuid);

    query = applyFilters(query, input, advancedTable, templateFields);

    const { data, error } = await query;
    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching all filtered records:", error);
    return [];
  }
}
