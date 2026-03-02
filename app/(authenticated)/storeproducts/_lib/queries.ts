import "server-only";
import callWooCommerceAPI from "@/lib/woocommerce";

// Fetch WooCommerce products (v3 API)
export async function getStoreProducts({
  page = 1,
  perPage = 20,
  search = "",
  sort = [],
  filters = [],
  status = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  flags = [],
}: {
  page?: number;
  perPage?: number;
  search?: string;
  sort?: Array<{ id: string; desc?: boolean }>;
  filters?: Array<{ id: string; value: string | string[] }>;
  status?: string[];
  flags?: unknown[];
}) {
  let url = `/wc/v3/products?page=${page}&per_page=${perPage}`;

  // Search
  if (search) url += `&search=${encodeURIComponent(search)}`;

  // Sorting (WooCommerce supports 'orderby' and 'order')
  if (Array.isArray(sort) && sort.length > 0) {
    const s = sort[0];
    if (s && s.id) url += `&order_by=${encodeURIComponent(s.id)}`;
    if (s && typeof s.desc === "boolean")
      url += `&order=${s.desc ? "desc" : "asc"}`;
  }

  if (Array.isArray(status) && status.length > 0) {
    url += `&status=${status.join(",")}`;
  }

  // Filters (e.g. status, category, type, etc)
  filters.forEach((f) => {
    if (f && f.id && f.value) {
      const filterValue = Array.isArray(f.value) ? f.value.join(",") : f.value;
      url += `&${encodeURIComponent(f.id)}=${encodeURIComponent(filterValue)}`;
    }
  });

  console.log("Fetching products from URL:", url);

  try {
    const { data, error, pages } = await callWooCommerceAPI(url, {
      method: "GET",
    });
    
    // Check if WooCommerce is not configured
    if (error && (error.includes("WooCommerce configuration not found") || error.includes("configuration not found") || error.includes("User session or business number") || error.includes("Site URL is missing"))) {
      return {
        data: [],
        pageCount: 0,
        error: "No WooCommerce configuration set. Please configure your WooCommerce settings to view products.",
        isConfigured: false,
      };
    }
    
    if (!data || error) throw new Error(error || "Failed to fetch products");
    return {
      data: data,
      pageCount: pages || 1,
      isConfigured: true,
    };
  } catch (err) {
    // Return empty data with error message instead of crashing
    return {
      data: [],
      pageCount: 0,
      error: err instanceof Error ? err.message : "Failed to fetch products",
      isConfigured: false,
    };
  }
}

// Dummy for status count (not used for users, but needed for table structure)
export async function getDocumentCountByField() {
  return {};
}

// Dummy for product groups (not used for users, but needed for table structure)
export async function getProductGroups() {
  return [];
}
