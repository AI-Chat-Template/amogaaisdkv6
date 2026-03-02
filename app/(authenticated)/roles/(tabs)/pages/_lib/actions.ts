"use server";

import { type PageList } from "../type";
import { revalidateTag, unstable_noStore } from "next/cache";
import type {
  CreatePageListSchema,
  QuickUpdatePageListSchema,
  UpdatePageListSchema,
} from "./validations";
import { postgrest } from "@/lib/postgrest";
import { getErrorMessage } from "@/lib/handle-error";
import { UploadAttachment } from "@/lib/minio";

export async function createRecord(
  input: CreatePageListSchema & { file?: File }
) {
  unstable_noStore();
  try {
    if (input.file) {
      const result = await UploadAttachment({
        file: input.file,
        fileName: input.file.name,
      });
      if (!result.success)
        throw new Error(result.error || "File upload failed.");
      input.icon = result.url;
    }

    const { data, error } = await postgrest
      .from("page_list")
      .insert([
        {
          ...input,
          created_date: new Date().toISOString(),
        },
      ])
      .select("pagelist_id")
      .single();

    if (error) throw error;

    revalidateTag("page_list");
    revalidateTag("page-list-status-counts");

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
  input: UpdatePageListSchema & { id: number; file?: File }
) {
  unstable_noStore();
  try {
    if (input.file) {
      const result = await UploadAttachment({
        file: input.file,
        fileName: input.file.name,
      });
      if (!result.success)
        throw new Error(result.error || "File upload failed.");
      input.icon = result.url;
    }

    const { id, ...rest } = input;
    const { data, error } = await postgrest
      .from("page_list")
      .update({
        ...rest,
      })
      .eq("pagelist_id", id)
      .select("status")
      .single();

    if (error) throw error;

    revalidateTag("page_list");
    if (data?.status === input.status) revalidateTag("page-list-status-counts");

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function quickUpdateRecord(
  input: QuickUpdatePageListSchema & { id: number }
) {
  unstable_noStore();
  try {
    const { data, error } = await postgrest
      .from("page_list")
      .update({
        status: input.status,
      })
      .eq("pagelist_id", input.id)
      .select("status")
      .single();

    if (error) throw error;

    revalidateTag("page_list");
    if (data?.status === input.status) revalidateTag("page-list-status-counts");

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
  status?: PageList["status"];
}) {
  unstable_noStore();
  try {
    const { data, error } = await postgrest
      .from("page_list")
      .update({
        status: input.status,
      })
      .in("pagelist_id", input.ids)
      .select("status");

    if (error) throw error;

    revalidateTag("page_list");
    if (data?.some((r) => r.status === input.status))
      revalidateTag("page-list-status-counts");

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
      .from("page_list")
      .delete()
      .eq("pagelist_id", input.id);

    if (error) throw error;

    revalidateTag("page_list");
    revalidateTag("page-list-status-counts");

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
      .from("page_list")
      .delete()
      .in("pagelist_id", input.ids);

    if (error) throw error;

    revalidateTag("page_list");
    revalidateTag("page-list-status-counts");

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}
