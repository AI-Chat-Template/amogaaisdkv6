"use server";

import callWooCommerceAPI from "@/lib/woocommerce";

// -----------------------------
// ✅ Types
// -----------------------------
export type CouponData = {
  id?: number;
  code: string;
  amount: string;
  status?: string;
  date_created?: string;
  date_modified?: string;
  discount_type: "fixed_cart" | "percent" | "fixed_product";
  description?: string;
  date_expires?: string;
  usage_limit_per_user?: number;
  free_shipping?: boolean;
  product_ids?: number[];
  exclude_sale_items?: boolean;
  minimum_amount?: string;
  maximum_amount?: string;
  email_restrictions?: string[];
  individual_use?: boolean;
};

export type Product = {
  id: number;
  name: string;
};

// -----------------------------
// ✅ Base URLs
// -----------------------------
const baseCouponUrl = "/wc/v3/coupons";
const baseProductUrl = "/wc/v3/products";

// -----------------------------
// ✅ Coupon CRUD
// -----------------------------

/**
 * Create a new WooCommerce coupon
 */
export const createCoupon = async (coupon: CouponData) => {
  try {
    const response = await callWooCommerceAPI(baseCouponUrl, {
      method: "POST",
      body: coupon,
    });

    if (!response.success) throw new Error(response.error);
    return response.data;
  } catch (err: any) {
    console.error("Create Coupon Error:", err);
    throw new Error(err.message || "Failed to create coupon");
  }
};

/**
 * Get single coupon by ID
 */
export const getCoupon = async (id: number): Promise<CouponData | null> => {
  try {
    const response = await callWooCommerceAPI(`${baseCouponUrl}/${id}?_=${Date.now()}`, {
      method: "GET",
      
    });

    if (!response.success || !response.data) return null;
    return response.data as CouponData;
  } catch (err: any) {
    console.error(`Error fetching coupon ${id}:`, err.message);
    return null;
  }
};


/**
 * Get all coupons (with optional filters)
 * Handles automatic pagination (WooCommerce REST API supports up to 100 per page)
 */
export const getCoupons = async (queryParams?: Record<string, any>) => {
  try {
    let allCoupons: CouponData[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const params = new URLSearchParams({
        per_page: "100",
        page: String(page),
        ...Object.fromEntries(
          Object.entries(queryParams || {}).map(([k, v]) => [k, String(v)])
        ),
      });

      const response = await callWooCommerceAPI(
        `${baseCouponUrl}?${params.toString()}`,
        { method: "GET" }
      );

      if (!response.success) throw new Error(response.error);

      const data = (response.data || []) as CouponData[];
      allCoupons = [...allCoupons, ...data];
      totalPages = response.pages || 1;
      page++;
    } while (page <= totalPages);

    return allCoupons;
  } catch (err: any) {
    console.error("Error fetching coupons:", err.message);
    return [];
  }
};

/**
 * Update coupon by ID
 */
export const updateCoupon = async (id: number, updates: Partial<CouponData>) => {
  try {
    const cleaned = {
      ...updates,
      date_expires: updates.date_expires
        ? new Date(updates.date_expires).toISOString().split("T")[0]
        : undefined,
      minimum_amount: updates.minimum_amount
        ? String(Number(updates.minimum_amount))
        : "",
      maximum_amount: updates.maximum_amount
        ? String(Number(updates.maximum_amount))
        : "",
    };

    const response = await callWooCommerceAPI(`${baseCouponUrl}/${id}`, {
      method: "PUT",
      body: cleaned,
    });

    if (!response.success) throw new Error(response.error);
    return response.data;
  } catch (err: any) {
    console.error(`Update Coupon ${id} Error:`, err.message);
    throw new Error(err.message || "Failed to update coupon");
  }
};


/**
 * Delete coupon by ID
 */
export const deleteCoupon = async (id: number) => {
  try {
    const response = await callWooCommerceAPI(`${baseCouponUrl}/${id}`, {
      method: "DELETE",
    });

    if (!response.success) throw new Error(response.error);
    return response.data;
  } catch (err: any) {
    console.error(`Delete Coupon ${id} Error:`, err.message);
    throw new Error(err.message || "Failed to delete coupon");
  }
};

// -----------------------------
// ✅ Products (for linking coupons to products)
// -----------------------------

/**
 * Fetch all products (auto-pagination)
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    let allProducts: Product[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const params = new URLSearchParams({
        per_page: "100",
        page: String(page),
      });

      const response = await callWooCommerceAPI(
        `${baseProductUrl}?${params.toString()}`,
        { method: "GET" }
      );

      if (!response.success) throw new Error(response.error);

      const data = response.data || [];
      const products: Product[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
      }));

      allProducts = [...allProducts, ...products];
      totalPages = response.pages || 1;
      page++;
    } while (page <= totalPages);

    return allProducts;
  } catch (err: any) {
    console.error("Failed to fetch products:", err.message);
    return [];
  }
};
