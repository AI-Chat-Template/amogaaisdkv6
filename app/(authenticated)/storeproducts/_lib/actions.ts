"use server";

import { type ProductType } from "../type";
import { revalidateTag, unstable_noStore } from "next/cache";
import type {
  CreateProductSchema,
  UpdateProductSchema,
  QuickUpdateProductSchema,
} from "./validations";
import callWooCommerceAPI from "@/lib/woocommerce";

export async function createRecord(input: CreateProductSchema) {
  unstable_noStore();
  try {
    const { data, error } = await callWooCommerceAPI("/wc/v3/products", {
      method: "POST",
      body: {
        ...input,
      },
    });

    if (error) throw error;
    if (!data) throw new Error("No data returned from WooCommerce API");

    revalidateTag("product");
    revalidateTag("products-status-counts");

    return {
      data,
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create record",
    };
  }
}

export async function updateRecord(input: UpdateProductSchema & { id: number }) {
  unstable_noStore();
  try {
    const { id, ...rest } = input;
    if (!id) {
      throw new Error("ID is required for updating a record");
    }
    // Update the product in the database
    const { data, error } = await callWooCommerceAPI(`/wc/v3/products/${id}`, {
      method: "PUT",
      body: {
        ...rest,
      },
    });

    if (error) {
      console.log(error);
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from WooCommerce API");
    }

    // Revalidate cache/tags
    revalidateTag("product");

    return { data: data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update record",
    };
  }
}

export async function quickUpdateRecord(
  input: QuickUpdateProductSchema & { id: number }
) {
  unstable_noStore();
  try {
    const { id, ...rest } = input;

    if (!id) {
      throw new Error("ID is required for quick updating a record");
    }
    const { data, error } = await callWooCommerceAPI(`/wc/v3/products/${id}`, {
      method: "PUT",
      body: {
        ...rest,
      },
    });

    if (error) {
      console.log(error);
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from WooCommerce API");
    }

    // Revalidate cache/tags
    revalidateTag("product");

    return { data: data, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Failed to quick update record",
    };
  }
}

export async function updateRecords(input: {
  ids: number[];
  status?: ProductType["status"];
}) {
  unstable_noStore();
  try {
    if (!input.ids || input.ids.length === 0) {
      throw new Error("IDs are required for updating records");
    }
    if (!input.status) {
      throw new Error("Status is required for updating records");
    }

    //update all ussers woo records
    const { data, error } = await callWooCommerceAPI("/wc/v3/products/batch", {
      method: "POST",
      body: {
        update: input.ids.map((id) => ({
          id,
          status: input.status,
        })),
      },
    });

    if (error) throw error;

    if (!data) {
      throw new Error("No data returned from WooCommerce API");
    }
    // Revalidate cache/tags
    revalidateTag("product");

    return { data: data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update records",
    };
  }
}

export async function deleteRecord(input: { id: number }) {
  unstable_noStore();
  try {
    if (!input.id) {
      throw new Error("ID is required for deleting a record");
    }
    const { data, error } = await callWooCommerceAPI(
      `/wc/v3/products/${input.id}`,
      {
        method: "DELETE",
        body: {
          // force: true, // Use force to permanently delete
        },
      }
    );
    if (error) {
      console.log(error);
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from WooCommerce API");
    }

    // Revalidate cache/tags
    revalidateTag("product");
    revalidateTag("products-status-counts");

    return { data: data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete record",
    };
  }
}

export async function deleteRecords(input: { ids: number[] }) {
  unstable_noStore();
  try {
    if (!input.ids || input.ids.length === 0) {
      throw new Error("IDs are required for deleting records");
    }
    // Delete all users woo records
    const { data, error } = await callWooCommerceAPI("/wc/v3/products/batch", {
      method: "DELETE",
      body: {
        // force: true, // Use force to permanently delete
        ids: input.ids,
      },
    });

    if (error) throw error;
    if (!data) {
      throw new Error("No data returned from WooCommerce API");
    }
    // Revalidate cache/tags
    revalidateTag("product");
    revalidateTag("products-status-counts");

    return { data: data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete records",
    };
  }
}
