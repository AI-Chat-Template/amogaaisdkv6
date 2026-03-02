import { type DataUpload, DataUploadStatuses } from "../type";
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
  sort: getSortingStateParser<DataUpload>().withDefault([
    { id: "created_date", desc: true },
  ]),
  file_name: parseAsString.withDefault(""),
  status: parseAsArrayOf(z.enum(DataUploadStatuses)).withDefault([]),
  priority: parseAsArrayOf(z.enum(DataUploadStatuses)).withDefault([]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export const createDataUploadSchema = z.object({
  status: z.enum(DataUploadStatuses),
  file_name: z.string().optional(),
  file_url: z.string().optional(),
  template_name: z.string().optional(),
  template_id: z.number().optional(),
  data_upload_uuid: z.string().optional(),
  data_table_name: z.string().optional(),
  data_upload_group: z.string().optional(),
  month: z.string().optional(),
  year: z.string().optional(),
  data_upload_uuid: z.string().optional(),
});

export const updateDataUploadSchema = z.object({
  status: z.enum(DataUploadStatuses),
  // file_name: z.string().min(1, "required"),
  file_url: z.string().optional(),
  created_date: z.string().datetime({ offset: true }).optional(),
  template_name: z.string().optional(),
  data_upload_group: z.string().optional(),
  month: z.string().optional(),
  year: z.string().optional(),
  // updated_date: z.string().datetime({ offset: true }).optional(),
});

export type GetDataUploadsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
export type CreateDataUploadSchema = z.infer<typeof createDataUploadSchema>;
export type UpdateDataUploadSchema = z.infer<typeof updateDataUploadSchema>;
