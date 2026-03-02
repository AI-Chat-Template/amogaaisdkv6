import { UserRoles, UserType } from "../type";
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
  sort: getSortingStateParser<UserType>().withDefault([
    { id: "created_date", desc: true },
  ]),
  query: parseAsString.withDefault(""),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  role: parseAsArrayOf(z.enum(UserRoles)).withDefault(["customer"]),
});

// User create schema for WooCommerce users
export const createUserSchema = z.object({
  username: z.string().min(1, "required"),
  email: z.string().email("Invalid email"),
  first_name: z.string().optional().default("").nullable(),
  last_name: z.string().optional().default("").nullable(),
  roles: z.array(z.string()).optional().default(["customer"]),
  // Add more fields as needed for your form
});

export const updateUserSchema = z.object({
  id: z.number(),
  username: z.string().min(1, "required"),
  email: z.string().email("Invalid email"),
  first_name: z.string().optional().default("").nullable(),
  last_name: z.string().optional().default("").nullable(),
  roles: z.array(z.string()).optional().default(["customer"]),
  // Add more fields as needed for your form
});

export const quickUpdateUserSchema = z.object({
  role: z.enum(UserRoles).default("customer"),
});

export type GetProductsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type QuickUpdateUserSchema = z.infer<typeof quickUpdateUserSchema>;
