import { type DataGroup, dataGroupStatuses } from "../type";
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import * as z from "zod";

import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";

export const searchParamsCache = createSearchParamsCache({
  flags: parseAsArrayOf(z.enum(["advancedTable", "floatingBar"])).withDefault(
    []
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(12),
  sort: getSortingStateParser<DataGroup>().withDefault([
    { id: "created_date", desc: true },
  ]),
  query: parseAsString.withDefault(""),
  status: parseAsArrayOf(z.enum(dataGroupStatuses)).withDefault([]),
  priority: parseAsArrayOf(z.enum(dataGroupStatuses)).withDefault([]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export const createDataGroupSchema = z.object({
  status: z.enum(dataGroupStatuses),
  template_name: z.string().min(1, "required"),
  template_file_fields_json: z
    .record(z.any())
    .refine((obj) => Object.keys(obj).length > 0, "required"),
  data_upload_group: z.string().min(1, "required"),
  data_table_name: z.string().min(1, "required"),
});

export const updateDataGroupSchema = z.object({
  status: z.enum(dataGroupStatuses),
  template_name: z.string().min(1, "required"),
  template_file_fields_json: z
    .record(z.any())
    .refine((obj) => Object.keys(obj).length > 0, "required"),
  data_upload_group: z.string().min(1, "required"),
  data_table_name: z.string().min(1, "required"),
});

export const quickUpdateDataGroupSchema = z.object({
  status: z.enum(dataGroupStatuses),
});

export type GetDataGroupSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
export type CreateDataGroupSchema = z.infer<typeof createDataGroupSchema>;
export type UpdateDataGroupSchema = z.infer<typeof updateDataGroupSchema>;
export type QuickUpdateDataGroupSchema = z.infer<
  typeof quickUpdateDataGroupSchema
>;
