import { type Contact, contactStatuses } from "../type";
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
  sort: getSortingStateParser<Contact>().withDefault([
    { id: "created_datetime", desc: true },
  ]),
  query: parseAsString.withDefault(""),
  status: parseAsArrayOf(z.enum(contactStatuses)).withDefault([]),
  priority: parseAsArrayOf(z.enum(contactStatuses)).withDefault([]),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export const createContactSchema = z.object({
  status: z.enum(contactStatuses),
  first_name: z.string().min(1, "required"),
  last_name: z.string().min(1, "required"),
  user_name: z.string().optional(),
  user_email: z.string().email().min(1, "required"),
  user_mobile: z
    .string()
    .min(1, { message: "Mobile number is required" })
    .regex(/^\+?[0-9]\d{9,14}$/, { message: "Invalid mobile number format" }),
  password: z
    .string()
    .min(1, {
      message: "Please enter your password",
    })
    .min(7, {
      message: "Password must be at least 7 characters long",
    }),
});

export const updateContactSchema = z.object({
  status: z.enum(contactStatuses),
  first_name: z.string().min(1, "required"),
  last_name: z.string().min(1, "required"),
  user_name: z.string().optional(),
  user_email: z.string().email().min(1, "required"),
  user_mobile: z
    .string()
    .min(1, { message: "Mobile number is required" })
    .regex(/^\+?[0-9]\d{9,14}$/, { message: "Invalid mobile number format" }),
  password: z
    .string()
    .min(1, {
      message: "Please enter your password",
    })
    .min(7, {
      message: "Password must be at least 7 characters long",
    }),
  roles_json: z.array(z.string()).nullish(),
});

export const quickUpdateContactSchema = z.object({
  status: z.enum(contactStatuses),
});

export type GetContactsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
export type CreateContactSchema = z.infer<typeof createContactSchema>;
export type UpdateContactSchema = z.infer<typeof updateContactSchema>;
export type QuickUpdateContactSchema = z.infer<typeof quickUpdateContactSchema>;
