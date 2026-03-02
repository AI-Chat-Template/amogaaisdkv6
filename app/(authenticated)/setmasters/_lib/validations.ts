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
  data_group_type: z.string().min(1, "required"),
  data_group_category: z.string(),
  data_group_name: z.string().min(1, "required"),
  name: z.string().optional(),
  short_description: z
    .string()
    .optional()
    .transform((val) => {
      return val?.trim() === "" || val === undefined ? null : val;
    })
    .nullable(),
  remarks: z
    .string()
    .optional()
    .transform((val) => {
      return val?.trim() === "" || val === undefined ? null : val;
    })
    .nullable(),
  data_model_json: z.string().transform((str) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return { e };
    }
  }),
  data_combination_json: z.string().optional(),
});

export const updateDataGroupSchema = z.object({
  status: z.enum(dataGroupStatuses),
  data_group_type: z.string().min(1, "required"),
  data_group_category: z.string(),
  data_group_name: z.string().min(1, "required"),
  name: z.string().optional(),
  short_description: z
    .string()
    .optional()
    .transform((val) => {
      return val?.trim() === "" || val === undefined ? null : val;
    })
    .nullable(),
  remarks: z
    .string()
    .optional()
    .transform((val) => {
      return val?.trim() === "" || val === undefined ? null : val;
    })
    .nullable(),
  data_model_json: z.string().transform((str) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return { e };
    }
  }),
  data_combination_json: z.string().optional(),
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
