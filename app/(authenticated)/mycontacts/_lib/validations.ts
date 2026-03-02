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
  profile_pic_url:z.string().optional().transform((val) => (val === "" ? null : val)),
  first_name: z.string().min(1, "required"),
  last_name: z.string().min(1, "required"),
  user_email: z.string().email().min(1, "required"),
  user_mobile: z
    .string()
    .min(1, { message: "Mobile number is required" })
    .regex(/^\+?[0-9]\d{9,14}$/, { message: "Invalid mobile number format" }),
  business: z.string().optional().transform((val) => (val === "" ? null : val)),
  business_roles: z.string().optional().transform((val) => (val === "" ? null : val)),
  business_address_1:z.string().optional().transform((val) => (val === "" ? null : val)),
  business_address_2:z.string().optional().transform((val) => (val === "" ? null : val)),
  business_country:z.string().optional().transform((val) => (val === "" ? null : val)),
  business_state:z.string().optional().transform((val) => (val === "" ? null : val)),
  business_city:z.string().optional().transform((val) => (val === "" ? null : val)),
  business_postcode:z.string().optional().transform((val) => (val === "" ? null : val))
});

export const updateContactSchema = z.object({
  status: z.enum(contactStatuses),
  profile_pic_url:z.string().optional().transform((val) => (val === "" ? null : val)),
  first_name: z.string().min(1, "required"),
  last_name: z.string().min(1, "required"),
  user_email: z.string().email().min(1, "required"),
  user_mobile: z
    .string()
    .min(1, { message: "Mobile number is required" })
    .regex(/^\+?[0-9]\d{9,14}$/, { message: "Invalid mobile number format" }),
  business: z.string().optional().transform((val) => (val === "" ? null : val)),
  business_roles: z.string().optional().transform((val) => (val === "" ? null : val)),
  business_address_1:z.string().optional().transform((val) => (val === "" ? null : val)),
  business_address_2:z.string().optional().transform((val) => (val === "" ? null : val)),
  business_country:z.string().optional().transform((val) => (val === "" ? null : val)),
  business_state:z.string().optional().transform((val) => (val === "" ? null : val)),
  business_city:z.string().optional().transform((val) => (val === "" ? null : val)),
  business_postcode:z.string().optional().transform((val) => (val === "" ? null : val))
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
