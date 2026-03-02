import "server-only";
import callWooCommerceAPI from "@/lib/woocommerce";

export async function getStoreUsers({
  page = 1,
  perPage = 20,
  search = "",
  sort = [],
  roles = [],
  filters = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  flags = [],
}: {
  page?: number;
  perPage?: number;
  search?: string;
  sort?: unknown[];
  roles?: string[];
  filters?: unknown[];
  flags?: unknown[];
}) {
  let url = `/wc/v3/customers?context=view&page=${page}&per_page=${perPage}`;

  // const { data, error, pages } = await callWooCommerceAPI(url, {
  //   method: "GET",
  // });
  // console.log("API Response:", { error, pages });
  // if (!data || error) throw new Error(error || "Failed to fetch users");

  // Search
  if (search) url += `&search=${encodeURIComponent(search)}`;

  // Sorting (WordPress supports 'orderby' and 'order')
  if (Array.isArray(sort) && sort.length > 0) {
    const s = sort[0];
    if (s && s.id) url += `&order_by=${encodeURIComponent(s.id)}`;
    if (s && typeof s.desc === "boolean")
      url += `&order=${s.desc ? "desc" : "asc"}`;
  }

  if (roles && roles.length > 0) {
    console.warn(
      "Roles filtering is not supported by WooCommerce API directly.",
      roles
    );
    url += `&role=${roles.join(",")}`;
  }

  // Filters (for future use, e.g. roles)
  filters.forEach((f) => {
    if (f && f.id && f.value) {
      url += `&${encodeURIComponent(f.id)}=${encodeURIComponent(f.value)}`;
    }
  });

  console.log("Fetching users from URL:", url);

  const { data, error, pages } = await callWooCommerceAPI(url, {
    method: "GET",
  });
  if (!data || error) throw new Error(error || "Failed to fetch users");
  return {
    data: data,
    pageCount: pages || 1,
  };
}

// Dummy for status count (not used for users, but needed for table structure)
export async function getDocumentCountByField() {
  return {};
}

// Dummy for product groups (not used for users, but needed for table structure)
export async function getProductGroups() {
  return [];
}
