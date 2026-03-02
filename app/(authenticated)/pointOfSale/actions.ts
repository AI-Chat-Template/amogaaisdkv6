"use server";

import callWooCommerceAPI from "@/lib/woocommerce";

export type Product = {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  description: string;
  short_description: string;
  images: Array<{ src: string; alt: string }>;
  stock_status: string;
  stock_quantity: number;
  categories: Array<{ id: number; name: string; slug: string }>;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  count: number;
};

export type BillingDetails = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};

export type ShippingDetails = {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
};

export type Customer = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  billing?: BillingDetails;
  shipping?: ShippingDetails;
};

/**
 * Get WooCommerce customers list with Guest option as first option.
 */
export async function getCustomers(): Promise<{
  success: boolean;
  data: Array<{ id: number; name: string; email?: string }>;
  error?: string;
}> {
  const perPage = 100;  // maximum allowed per request by Woo API
  let page = 1;
  let allCustomers: Array<{ id: number; name: string; email?: string }> = [];

  try {
    while (true) {
      const url = `/wc/v3/customers?per_page=${perPage}&page=${page}`;
      const result = await callWooCommerceAPI(url);

      if (!result.success) {
        return result;
      }

      const customersBatch = result.data.map((c: any) => ({
        id: c.id,
        name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.username || "Unnamed",
        email: c.email,
      }));

      allCustomers = [...allCustomers, ...customersBatch];

      if (customersBatch.length < perPage) {
        // last page reached, break out of loop
        break;
      }

      page++;
    }

    // Add Guest customer at the beginning
    const dataWithGuest = [{ id: 0, name: "Guest", email: "" }, ...allCustomers];

    return { success: true, data: dataWithGuest };
  } catch (e: any) {
    return { success: false, data: [], error: e.message || "Failed to fetch customers" };
  }
}


/**
 * Get single WooCommerce customer details including billing & shipping.
 */
export async function getCustomerById(
  customerId: number
): Promise<{ success: boolean; data?: Customer; error?: string }> {
  try {
    const url = `/wc/v3/customers/${customerId}`;
    const result = await callWooCommerceAPI(url);
    if (!result.success) return result;
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.message || "Error fetching customer" };
  }
}

/**
 * Get WooCommerce products with optional filters.
 */
export async function getProducts(params?: {
  category?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<{ success: boolean; data: Product[]; pages?: number; error?: string }> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append("category", params.category);
  if (params?.search) queryParams.append("search", params.search);
  queryParams.append("page", String(params?.page || 1));
  queryParams.append("per_page", String(params?.per_page || 20));

  const url = `/wc/v3/products?${queryParams.toString()}`;
  return await callWooCommerceAPI(url);
}

/**
 * Get WooCommerce product categories.
 */
export async function getCategories(): Promise<{
  success: boolean;
  data: Category[];
  error?: string;
}> {
  const url = "/wc/v3/products/categories?per_page=100&hide_empty=true";
  return await callWooCommerceAPI(url);
}

/**
 * Get product details by ID.
 */
export async function getProductById(
  productId: number
): Promise<{ success: boolean; data: Product; error?: string }> {
  const url = `/wc/v3/products/${productId}`;
  return await callWooCommerceAPI(url);
}

/**
 * Create WooCommerce order with billing & shipping info.
 */
export async function createOrder(orderData: {
  line_items: Array<{ product_id: number; quantity: number }>;
  customer_id?: number;
  payment_method?: string;
  payment_method_title?: string;
  set_paid?: boolean;
  billing?: BillingDetails;
  shipping?: ShippingDetails;
}): Promise<{ success: boolean; data: any; error?: string }> {
  const url = "/wc/v3/orders";
  return await callWooCommerceAPI(url, {
    method: "POST",
    body: orderData,
  });
}
