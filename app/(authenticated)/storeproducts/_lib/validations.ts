import { ProductStatuses, ProductType } from "../type";
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
  sort: getSortingStateParser<ProductType>().withDefault([
    { id: "created_date", desc: true },
  ]),
  query: parseAsString.withDefault(""),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  status: parseAsArrayOf(z.enum(ProductStatuses)).withDefault(["publish"]),
});

// Product create schema for WooCommerce products
export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  type: z.string().default("simple"),
  regular_price: z.string().default("0"),
  description: z.string().optional().default("").nullable(),
  short_description: z.string().optional().default("").nullable(),
  sku: z.string().optional().default("").nullable(),
  status: z.enum(ProductStatuses).default("publish"),
  stock_quantity: z.number().optional().nullable(),
  categories: z.array(z.object({ id: z.number(), name: z.string(), slug: z.string() })).optional().default([]),
  images: z.array(z.object({ src: z.string(), name: z.string().optional(), alt: z.string().optional() })).optional().default([]),
  // Add more fields as needed for your form
});

export const updateProductSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Product name is required"),
  type: z.string().default("simple"),
  regular_price: z.string().default("0"),
  description: z.string().optional().default("").nullable(),
  short_description: z.string().optional().default("").nullable(),
  sku: z.string().optional().default("").nullable(),
  status: z.enum(ProductStatuses).default("publish"),
  stock_quantity: z.number().optional().nullable(),
  categories: z.array(z.object({ id: z.number(), name: z.string(), slug: z.string() })).optional().default([]),
  images: z.array(z.object({ src: z.string(), name: z.string().optional(), alt: z.string().optional() })).optional().default([]),
  // Add more fields as needed for your form
});

export const quickUpdateProductSchema = z.object({
  status: z.enum(ProductStatuses).default("publish"),
});

export type GetProductsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
export type QuickUpdateProductSchema = z.infer<typeof quickUpdateProductSchema>;
