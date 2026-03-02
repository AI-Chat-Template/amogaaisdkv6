
export type ProductType = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  total_sales: number;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: string;
  backorders: string;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  attributes: Array<unknown>;
  default_attributes: Array<unknown>;
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: Array<unknown>;
  [key: string]: unknown;
};

// Table column type for ProductType
export type ProductTypeTableColumn = keyof ProductType | "actions";

// Dummy exports for compatibility with validations.ts (not used for users)
export const publishStatuses: string[] = [];

export const ProductStatuses = [
  "publish",
  "future",
  "trash",
  "draft",
  "pending",
  "private",
] as const;
export type ProductStatuse = (typeof ProductStatuses)[number];
