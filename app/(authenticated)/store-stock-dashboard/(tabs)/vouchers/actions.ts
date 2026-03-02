/* eslint-disable */
"use server";

import { auth } from "@/auth";
import woorest from "@/lib/woorest";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const getCategoriesData = async function () {
  try {
    const session = await auth();
    const business_number = session?.user.business_number;
    const categories = await woorest(
      `/wc/v3/products/categories?per_page=100&business_number=${business_number}`
    );

    if (!Array.isArray(categories) || categories.length === 0) {
      return {
        error: "the categories dos not exist",
      };
    }
    return {
      success: categories,
    };
  } catch (error) {
    return {
      error: "somthing went wrong",
    };
  }
};

export const getTaxClassesData = async function () {
  try {
    const data = await woorest(`/wc/v3/taxes/classes?per_page=100`);

    if (!Array.isArray(data) || data.length === 0) {
      return {
        error: "the data dos not exist",
      };
    }
    return {
      success: data,
    };
  } catch (error) {
    return {
      error: "somthing went wrong",
    };
  }
};

export const getShippingClassesData = async function () {
  try {
    const data = await woorest(`/wc/v3/products/shipping_classes?per_page=100`);

    if (!Array.isArray(data) || data.length === 0) {
      return {
        error: "the data dos not exist",
      };
    }
    return {
      success: data,
    };
  } catch (error) {
    return {
      error: "somthing went wrong",
    };
  }
};

export const getProductData = async function (id: string) {
  try {
    const data = await woorest(`/wc/v3/products/${id}`);

    if (!data.id) {
      return {
        error: "the user catalog dos not exist",
      };
    }
    return {
      success: data,
    };
  } catch (error) {
    return {
      error: "somthing went wrong",
    };
  }
};

export const createProductData = async function (values: {}) {
  try {
    const session = await auth();
    const data = await woorest(`/wc/v3/products`, "POST", {
      ...values,
      business_number: session?.user.business_number,
      business_name: session?.user.business_name,
    });

    if (!data.id) {
      return {
        error: "erorr in data creation",
      };
    }

    revalidatePath("/products");

    return {
      success: "data created successfully",
      data: data,
    };
  } catch (error) {
    return {
      error: "somthing went wrong",
    };
  }
};

export const updateProductData = async function (id: string, values: {}) {
  try {
    const data = await woorest(`/wc/v3/products/${id}`, "POST", values);

    // console.log("data response ", data);
    if (!data.id) {
      return {
        error: "erorr in data update",
      };
    }

    revalidatePath("/products");

    return {
      success: "data updated successfully",
      data: data,
    };
  } catch (error) {
    console.error("error update", error);
    return {
      error: "somthing went wrong",
    };
  }
};

export async function navigate(tabName: string) {
  redirect(`/products?tab=${tabName}`);
}
