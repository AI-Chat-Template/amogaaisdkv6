import { type RoleList, roleListStatuses } from "../type";
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
  sort: getSortingStateParser<RoleList>().withDefault([
    { id: "created_date", desc: true },
  ]),
  query: parseAsString.withDefault(""),
  status: parseAsArrayOf(z.enum(roleListStatuses)).withDefault([]),
  priority: parseAsArrayOf(z.enum(roleListStatuses)).withDefault([]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export const createRoleListSchema = z.object({
  role_title: z.string().min(1, "required"),
  description: z.string().min(1, "required"),
  icon: z.string().optional(),
  app_name: z.string().min(1, "required"),
  created_date: z.date().optional(),
  status: z.enum(roleListStatuses),
});

export const updateRoleListSchema = z.object({
  role_title: z.string().min(1, "required"),
  description: z.string().min(1, "required"),
  icon: z.string().optional(),
  app_name: z.string().min(1, "required"),
  created_date: z.date().optional(),
  status: z.enum(roleListStatuses),
});

export const quickUpdateRoleListSchema = z.object({
  status: z.enum(roleListStatuses),
});

export type GetRoleListsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
export type CreateRoleListSchema = z.infer<typeof createRoleListSchema>;
export type UpdateRoleListSchema = z.infer<typeof updateRoleListSchema>;
export type QuickUpdateRoleListSchema = z.infer<typeof quickUpdateRoleListSchema>;
