import { type PageList, pageListStatuses } from "../type";
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
  sort: getSortingStateParser<PageList>().withDefault([
    { id: "created_date", desc: true },
  ]),
  query: parseAsString.withDefault(""),
  status: parseAsArrayOf(z.enum(pageListStatuses)).withDefault([]),
  priority: parseAsArrayOf(z.enum(pageListStatuses)).withDefault([]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export const createPageListSchema = z.object({
  page_name: z.string().min(1, "required"),
  page_link: z.string().min(1, "required"),
  app_name: z.string().min(1, "required"),
  created_date: z.date().optional(),
  updated_date: z.date().optional(),
  status: z.enum(pageListStatuses),
  role_json: z.array(z.string()).nullish(),
});

export const updatePageListSchema = z.object({
  page_name: z.string().min(1, "required"),
  page_link: z.string().min(1, "required"),
  app_name: z.string().min(1, "required"),
  created_date: z.date().optional(),
  updated_date: z.date().optional(),
  status: z.enum(pageListStatuses),
  role_json: z.array(z.string()).nullish(),
  icon: z.string().optional(),
});

export const quickUpdatePageListSchema = z.object({
  status: z.enum(pageListStatuses),
});

export type GetPageListsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
export type CreatePageListSchema = z.infer<typeof createPageListSchema>;
export type UpdatePageListSchema = z.infer<typeof updatePageListSchema>;
export type QuickUpdatePageListSchema = z.infer<
  typeof quickUpdatePageListSchema
>;
