/* eslint-disable */
"use server";

import crypto from "crypto";
import callWooCommerceAPI from "@/lib/woocommerce";

export type WooImage = { src: string; alt?: string };
export type WooCategory = { id: number; name: string; slug: string; parent: number };

export type WooProductCore = {
  id: number;
  name: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  images: WooImage[];
  stock_status?: "instock" | "outofstock" | "onbackorder" | string;
  stock_quantity?: number | null;
  short_description?: string;
  description?: string;
  categories?: { id: number; name?: string }[];

  sku?: string;
  weight?: string;
  dimensions?: {
    length?: string;
    width?: string;
    height?: string;
  };
  tax_status?: "taxable" | "shipping" | "none";
  tax_class?: "" | "reduced-rate" | "zero-rate";
  shipping_class?: "" | "free-shipping";
  purchase_note?: string;
  status?: "publish" | "draft" | "private";
};

export type UpsertPayload = {
  name: string;
  regular_price?: string;              // numeric string per Woo
  sale_price?: string;                // numeric string per Woo
  stock_quantity?: number | null;     // number to set, null to clear, undefined to leave unchanged
  stock_status?: "instock" | "outofstock" | "onbackorder";
  description?: string;
  short_description?: string;
  sku?: string;
  weight?: string;
  dimensions?: {
    length?: string;
    width?: string;
    height?: string;
  };

  image?: string;                     // first image URL
  status?: "publish" | "draft" | "private";
  categories?: number[];
  tax_status?: "taxable" | "shipping" | "none";
  tax_class?: "" | "reduced-rate" | "zero-rate";
  shipping_class?: "" | "free-shipping";
  purchase_note?: string;
};

const normalize = (p: any): WooProductCore => ({
  id: p.id,
  name: p.name,
  price: p.price,
  regular_price: p.regular_price,
  sale_price: p.sale_price,
  images: Array.isArray(p.images) ? p.images : [],
  stock_status: p.stock_status,
  stock_quantity: p.stock_quantity ?? null,
  short_description: p.short_description,
  description: p.description,
  categories: Array.isArray(p.categories) ? p.categories : undefined,

  sku: p.sku,
  weight: p.weight,
  dimensions: p.dimensions,
  tax_status: p.tax_status,
  tax_class: p.tax_class,
  shipping_class: p.shipping_class,
  purchase_note: p.purchase_note,
  status: p.status,
});

const normalizeCategory = (c: any): WooCategory => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  parent: c.parent ?? 0,
});

export async function getWooCategories(params?: { search?: string; perPage?: number; page?: number }) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 100;
  const search = params?.search?.trim();

  const qs = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    ...(search ? { search } : {}),
    hide_empty: "false",
    orderby: "name",
  });

  const res = await callWooCommerceAPI(`/wc/v3/products/categories?${qs.toString()}`, {
    method: "GET",
    cache: 0,
  });
  if (!res.success) throw new Error(res.error || "Failed to load categories");
  return (res.data as any[]).map(normalizeCategory);
}

export async function getWooProducts(params: { search?: string; page?: number; perPage?: number }) {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 20;
  const search = params.search?.trim();

  const qs = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    status: "publish",
    ...(search ? { search } : {}),
  });

  const res = await callWooCommerceAPI(`/wc/v3/products?${qs.toString()}`, { method: "GET", cache: 0 });
  if (!res.success) throw new Error(res.error || "Failed to load products");
  return { products: (res.data as any[]).map(normalize), pages: res.pages ?? 1 };
}

export async function getWooProductById(id: string | number) {
  const res = await callWooCommerceAPI(`/wc/v3/products/${id}`, { method: "GET", cache: 0 });
  if (!res.success) throw new Error(res.error || "Failed to load product");
  return normalize(res.data);
}

export async function createWooProduct(input: UpsertPayload) {
  const body: any = {
    name: input.name,
    type: "simple",
    ...(input.regular_price ? { regular_price: String(input.regular_price) } : {}),
    ...(input.sale_price ? { sale_price: String(input.sale_price) } : {}),
    ...(typeof input.stock_quantity === "number" ? { manage_stock: true, stock_quantity: input.stock_quantity } : {}),
    ...(input.stock_status ? { stock_status: input.stock_status } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.short_description !== undefined ? { short_description: input.short_description } : {}),
    ...(input.image ? { images: [{ src: input.image }] } : {}),
    ...(Array.isArray(input.categories) && input.categories.length ? { categories: input.categories.map((id) => ({ id })) } : {}),
    status: input.status || "publish",
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.weight ? { weight: input.weight } : {}),
    ...(input.dimensions ? { dimensions: { ...input.dimensions } } : {}),
    ...(input.tax_status ? { tax_status: input.tax_status } : {}),
    ...(input.tax_class ? { tax_class: input.tax_class } : {}),
    ...(input.shipping_class ? { shipping_class: input.shipping_class } : {}),
    ...(input.purchase_note ? { purchase_note: input.purchase_note } : {}),
  };

  const res = await callWooCommerceAPI(`/wc/v3/products`, { method: "POST", body, cache: 0 });

  if (!res.success) {
    console.error("Woo create error:", res.data);
    throw new Error(res.error || res.data?.message || "Failed to create product");
  }

  return normalize(res.data);
}

export async function updateWooProduct(id: string | number, input: UpsertPayload) {
  const regular_price = typeof input.regular_price === "string" ? input.regular_price : undefined;
  const sale_price = typeof input.sale_price === "string" ? input.sale_price : undefined;
  const hasQty = typeof input.stock_quantity === "number" && !Number.isNaN(input.stock_quantity);

  const body: any = {
    name: input.name,
    ...(regular_price !== undefined ? { regular_price: regular_price.trim() } : {}),
    ...(sale_price !== undefined ? { sale_price: sale_price.trim() } : {}),
    ...(hasQty ? { manage_stock: true, stock_quantity: input.stock_quantity } : { stock_quantity: input.stock_quantity === null ? null : undefined }),
    ...(input.stock_status ? { stock_status: input.stock_status } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.short_description !== undefined ? { short_description: input.short_description } : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.weight ? { weight: input.weight } : {}),
    ...(input.dimensions ? { dimensions: { ...input.dimensions } } : {}),
    ...(input.image ? { images: [{ src: input.image }] } : {}),
    ...(Array.isArray(input.categories) && input.categories.length ? { categories: input.categories.map((id) => ({ id })) } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.tax_status ? { tax_status: input.tax_status } : {}),
    ...(input.tax_class ? { tax_class: input.tax_class } : {}),
    ...(input.shipping_class ? { shipping_class: input.shipping_class } : {}),
    ...(input.purchase_note ? { purchase_note: input.purchase_note } : {}),
  };

  const res = await callWooCommerceAPI(`/wc/v3/products/${id}`, { method: "PUT", body, cache: 0 });
  if (!res.success) {
    console.error("Woo update error:", res.data);
    throw new Error(res.error || res.data?.message || "Failed to update product");
  }

  return normalize(res.data);
}

export async function deleteWooProduct(id: string | number) {
  const res = await callWooCommerceAPI(`/wc/v3/products/${id}?force=true`, { method: "DELETE", cache: 0 });
  if (!res.success) {
    console.error("Woo delete error:", res.data);
    throw new Error(res.error || res.data?.message || "Failed to delete product");
  }
  return { success: true, id: Number(id) };
}

/**
 * MEDIA UPLOAD via Cloudinary (stable, no WP permissions required)
 * Input: base64 + file meta from client
 * Output: { id, url } where url is a public HTTPS image URL
 * Use url in product payload as images: [{ src: url }]
 */
export async function uploadMediaFromClient(input: {
  fileName: string;
  type: string;
  base64: string;
}) {
  const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
  const API_KEY = process.env.CLOUDINARY_API_KEY!;
  const API_SECRET = process.env.CLOUDINARY_API_SECRET!;
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error("Cloudinary env missing");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "products";
  const publicId = input.fileName.replace(/\.[^/.]+$/, "");

  const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  const form = new FormData();
  form.set("file", `data:${input.type || "image/jpeg"};base64,${input.base64}`);
  form.set("api_key", API_KEY);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  form.set("folder", folder);
  form.set("public_id", publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form as any,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.secure_url) {
    throw new Error(json?.error?.message || `Cloudinary upload failed: ${res.status}`);
  }

  return { id: json.public_id as string, url: json.secure_url as string };
}
