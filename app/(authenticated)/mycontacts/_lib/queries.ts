import "server-only";
import { postgrest } from "@/lib/postgrest";
import type { GetContactsSchema } from "./validations";
import { filterSupabase } from "@/lib/filter-columns";
import { contactStatuses } from "../type";

function applyFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  input: GetContactsSchema,
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
        `first_name.ilike.%${input.query}%,last_name.ilike.%${input.query}%,user_email.ilike.%${input.query}%`
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

export async function getRecords(input: GetContactsSchema) {
  try {
    const { page, perPage, sort, flags } = input;
    const offset = (page - 1) * perPage;
    const advancedTable = flags.includes("advancedTable");

    let query = postgrest.from("user_catalog").select("*").eq("contact_user","Yes");
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
      .from("user_catalog")
      .select("*", { count: "exact", head: true }).eq("contact_user","Yes");
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
      ? contactStatuses
      : [];
    if (!values.length) return {} as Record<string, number>;

    const counts = await Promise.all(
      values.map(async (v) => {
        const { count } = await postgrest
          .from("user_catalog")
          .select("*", { count: "exact" })
          .eq("contact_user","Yes")
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
