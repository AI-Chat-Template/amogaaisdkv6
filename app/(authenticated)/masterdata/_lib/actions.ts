"use server";

import { type DataGroup } from "../type";
import { revalidateTag, unstable_noStore } from "next/cache";
import type {
  CreateDataGroupSchema,
  UpdateDataGroupSchema,
  QuickUpdateDataGroupSchema,
} from "./validations";
import { postgrest } from "@/lib/postgrest";
import { getErrorMessage } from "@/lib/handle-error";
import { auth } from "@/auth";

export async function createRecord(
  input: CreateDataGroupSchema
) {
  unstable_noStore();
  try {
    const session = await auth();
    
    const { data, error } = await postgrest
      .from("data_group")
      .insert([
        {
          ...input,
          created_user_id: session?.user?.user_catalog_id,
          created_user_name: session?.user?.user_name || "",
          business_number: session?.user?.business_number || "",
          business_name: session?.user?.business_name || "",
          for_business_number: session?.user?.business_number || "",
          for_business_name: session?.user?.business_name || "",
          created_date: new Date().toISOString()
        },
      ])
      .select("data_group_id")
      .single();

    if (error) throw error;

    revalidateTag("datagroup");
    revalidateTag("datagroup-status-counts");

    return {
      data,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateRecord(
  input: UpdateDataGroupSchema & { id: number}
) {
  unstable_noStore();
  try {
    const { id, ...rest } = input;
    
    const { data, error } = await postgrest
      .from("data_group")
      .update({
        ...rest,
        data_group_id: id,
        updated_date: new Date().toISOString(),
      })
      .eq("data_group_id", input.id)
      .select("status")
      .single();

    if (error) {
      console.log(error);
      throw error;
    }

    // Revalidate cache/tags
    revalidateTag("datagroup");
    if (data?.status === input.status) revalidateTag("datagroup-status-counts");

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function quickUpdateRecord(
  input: QuickUpdateDataGroupSchema & { id: number }
) {
  unstable_noStore();
  try {
    const { data, error } = await postgrest
      .from("data_group")
      .update({
        status: input.status,
      })
      .eq("data_group_id", input.id)
      .select("status")
      .single();

    if (error) throw error;

    // Revalidate cache/tags
    revalidateTag("datagroup");
    if (data?.status === input.status) revalidateTag("datagroup-status-counts");

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateRecords(input: {
  ids: number[];
  status?: DataGroup["status"];
}) {
  unstable_noStore();
  try {
    const { data, error } = await postgrest
      .from("data_group")
      .update({
        status: input.status,
      })
      .in("data_group_id", input.ids)
      .select("status");

    if (error) throw error;

    // Revalidate cache/tags
    revalidateTag("datagroup");
    if (data?.some((r) => r.status === input.status))
      revalidateTag("datagroup-status-counts");

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteRecord(input: { id: number }) {
  unstable_noStore();
  try {
    const { error } = await postgrest
      .from("data_group")
      .delete()
      .eq("data_group_id", input.id);

    if (error) throw error;

    // Revalidate cache/tags
    revalidateTag("datagroup");
    revalidateTag("datagroup-status-counts");

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteRecords(input: { ids: number[] }) {
  unstable_noStore();
  try {
    const { error } = await postgrest
      .from("data_group")
      .delete()
      .in("data_group_id", input.ids);

    if (error) throw error;

    // Revalidate cache/tags
    revalidateTag("datagroup");
    revalidateTag("datagroup-status-counts");

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}
