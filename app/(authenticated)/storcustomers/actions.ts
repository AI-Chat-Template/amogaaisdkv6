"use server";
import callWooCommerceAPI from "@/lib/woocommerce";

// ----------------------
// Customer Types
// ----------------------
export type CustomerBilling = {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
};

export type CustomerShipping = {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

export type Customer = {
  id: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  date_created?: string;
  date_modified?: string;
  billing?: CustomerBilling;
  shipping?: CustomerShipping;
  avatar_url?: string;
  meta_data?: any[];
};

// ----------------------
// Helper: Pick only safe fields for update/create
// ----------------------
const pickCustomerFields = (data: Partial<Customer>): Partial<Customer> => {
  const payload: Partial<Customer> = {};
  if (data.first_name !== undefined) payload.first_name = data.first_name;
  if (data.last_name !== undefined) payload.last_name = data.last_name;
  if (data.username !== undefined) payload.username = data.username;
  if (data.email !== undefined) payload.email = data.email;
  if (data.role !== undefined) payload.role = data.role;

  if (data.billing) {
    payload.billing = {};
    const allowedBillingFields: (keyof CustomerBilling)[] = [
      "first_name",
      "last_name",
      "company",
      "address_1",
      "address_2",
      "city",
      "state",
      "postcode",
      "country",
      "email",
      "phone",
    ];
    allowedBillingFields.forEach((f) => {
      if (data.billing![f] !== undefined) payload.billing![f] = data.billing![f];
    });
  }

  if (data.shipping) {
    payload.shipping = {};
    const allowedShippingFields: (keyof CustomerShipping)[] = [
      "first_name",
      "last_name",
      "company",
      "address_1",
      "address_2",
      "city",
      "state",
      "postcode",
      "country",
    ];
    allowedShippingFields.forEach((f) => {
      if (data.shipping![f] !== undefined) payload.shipping![f] = data.shipping![f];
    });
  }

  if (data.avatar_url !== undefined) payload.avatar_url = data.avatar_url;
  if (data.meta_data !== undefined) payload.meta_data = data.meta_data;

  return payload;
};

// ----------------------
// API Functions
// ----------------------

// Fetch all customers
export const getAllCustomers = async (): Promise<Customer[]> => {
  let allCustomers: Customer[] = [];
  let page = 1;
  const perPage = 100;
  let totalPages = 1;

  do {
    const res = await callWooCommerceAPI(
      `/wc/v3/customers?role=all&per_page=${perPage}&page=${page}`,
      { method: "GET" }
    );
    if (!res.success) throw new Error(res.error || "Failed to fetch customers");
    allCustomers = [...allCustomers, ...res.data];
    totalPages = res.pages || 1;
    page++;
  } while (page <= totalPages);

  return allCustomers;
};

// Create customer
export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  const payload = pickCustomerFields(data);
  const res = await callWooCommerceAPI(`/wc/v3/customers`, {
    method: "POST",
    body: payload, // pass raw object, not stringified
  });
  if (!res.success) throw new Error(res.error || "Failed to create customer");
  return res.data;
};

// Update customer (safe fields)
export const updateCustomer = async (id: number, data: Partial<Customer>): Promise<Customer> => {
  const payload = pickCustomerFields(data);
  const res = await callWooCommerceAPI(`/wc/v3/customers/${id}`, {
    method: "PUT",
    body: payload, // pass raw object, not stringified
  });
  if (!res.success) throw new Error(res.error || "Failed to update customer");
  return res.data;
};

// Delete customer
export const deleteCustomer = async (id: number): Promise<Customer> => {
  const res = await callWooCommerceAPI(`/wc/v3/customers/${id}?force=true`, {
    method: "DELETE",
  });
  if (!res.success) throw new Error(res.error || "Failed to delete customer");
  return res.data;
};
