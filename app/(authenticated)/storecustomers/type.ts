import { DataTableRowAction } from "@/types";
import { Row } from "@tanstack/react-table";

export const UserRoles = [
  "all",
  "administrator",
  "editor",
  "author",
  "contributor",
  "subscriber",
  "customer",
  "shop_manager",
] as const;

export type UserRole = (typeof UserRoles)[number];

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string[];
  registered_date: string;
  // Add other relevant user fields from WooCommerce API if needed
};

export type ExtendedRowAction =
  | DataTableRowAction<User>
  | { type: "enhancer"; row: Row<User> | null }
  | null;

// Table column type for user
export type UserTableColumn = keyof User | "actions";

// Filter field type for user table
export type UserFilterField = {
  id: keyof User | "roles";
  label: string;
};

// Dummy exports for compatibility with validations.ts (not used for users)
export const productStatuses: string[] = [];
export const publishStatuses: string[] = [];

//add type for user its woocommerce user type
export type UserType = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  date_created: string;
  date_created_gmt: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  avatar_url: string;
  is_paying_customer: boolean;
  meta_data: {
    id: number;
    key: string;
    value: string | number | boolean | null;
  }[];
  [key: string]: unknown; // Allow additional fields
};

export type CustomerReport = {
  avg_order_value: number;
  city: string;
  country: string;
  date_last_active: string;
  date_last_active_gmt: string;
  date_last_order: null;
  date_registered: null;
  date_registered_gmt: null;
  email: string;
  id: number;
  name: string;
  orders_count: number;
  postcode: string;
  state: string;
  total_spend: number;
  user_id: number;
  username: string;
};
