import "server-only";
import { postgrest } from "@/lib/postgrest";
import type { GetDataGroupSchema } from "./validations";
import { filterSupabase } from "@/lib/filter-columns";
import { dataGroupStatuses } from "../type";

const dataUploadGroup = [
  "Inventory Ledger Data Upload",
  "Raw BOM Data Upload",
  "Final BOM Data Upload",
  "Invoice Data Upload",
  "Stock Data Upload",
  "Month Stock Upload",
  "Data Upload",
];

debugger;
function applyFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  input: GetDataGroupSchema,
  advancedTable: boolean
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
    if (input.query) {
      query = query.or(
        `template_name.ilike.%${input.query}%,data_table_name.ilike.%${input.query}%`
      );
    }
    if (input.from) {
      query = query.gte("updated_date", new Date(input.from).toISOString());
    }
    if (input.to) {
      query = query.lte("updated_date", new Date(input.to).toISOString());
    }
    if (input?.status?.length > 0) {
      query = query.in("status", input.status);
    }
  }
  return query;
}

export async function getRecords(input: GetDataGroupSchema) {
  try {
    const { page, perPage, sort, flags } = input;
    const offset = (page - 1) * perPage;
    const advancedTable = flags.includes("advancedTable");

    let query = postgrest
      .from("data_upload_setup")
      .select("*")
      .in("data_upload_group", dataUploadGroup);
    query = applyFilters(query, input, advancedTable);

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
      .from("data_upload_setup")
      .select("*", { count: "exact", head: true });
    countQuery = applyFilters(countQuery, input, advancedTable);

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    const pageCount = Math.ceil((count || 0) / perPage);
    return { data: data, pageCount };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return { data: [], pageCount: 0 };
  }
}

export async function getDocumentCountByField(
  field: string,
  fieldValues?: string[]
) {
  try {
    const values = fieldValues
      ? fieldValues
      : field === "status"
      ? dataGroupStatuses
      : [];
    if (!values.length) return {} as Record<string, number>;

    const counts = await Promise.all(
      values.map(async (v) => {
        const { count } = await postgrest
          .from("data_group")
          .select("*", { count: "exact" })
          .eq(field, v);
        return { v, count: count || 0 };
      })
    );
    return counts.reduce((acc, { v, count }) => {
      acc[v] = count;
      return acc;
    }, {} as Record<string, number>);
  } catch (error) {
    console.error(`Error fetching document counts by ${field}:`, error);
    return {} as Record<string, number>;
  }
}
