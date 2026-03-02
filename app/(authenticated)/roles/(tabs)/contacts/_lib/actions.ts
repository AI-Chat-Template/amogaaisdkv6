"use server";

import { type Contact } from "../type";
import { revalidateTag, unstable_noStore } from "next/cache";
import type {
  CreateContactSchema,
  UpdateContactSchema,
  QuickUpdateContactSchema,
} from "./validations";
import { postgrest } from "@/lib/postgrest";
import { getErrorMessage } from "@/lib/handle-error";
import { UploadAttachment } from "@/lib/minio";
import { auth } from "@/auth";

export async function createRecord(
  input: CreateContactSchema & { file?: File }
) {
  unstable_noStore();
  try {
    const session = await auth();

    if (input.file) {
      const result = await UploadAttachment({
        file: input.file,
        fileName: input.file.name,
      });
      if (!result.success)
        throw new Error(result.error || "File upload failed.");
      // input.shareurl = result.url;
    }

    const { data, error } = await postgrest.asAdmin()
      .from("user_catalog")
      .insert([
        {
          ...input,
          for_business_number: session?.user?.business_number || "",
          for_business_name: session?.user?.business_name || "",
          created_datetime: new Date().toISOString(),
          // updated_date: new Date().toISOString(),
        },
      ])
      .select("user_catalog_id")
      .single();

    if (error) throw error;

    revalidateTag("user_catalog");
    revalidateTag("contacts-status-counts");

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
  input: UpdateContactSchema & { id: number; file?: File }
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
      // input.shareurl = result.url;
    }

    const { id, ...rest } = input;
    const { data, error } = await postgrest.asAdmin()
      .from("user_catalog")
      .update({
        ...rest,
        user_catalog_id: id,
        // updated_date: new Date().toISOString(),
      })
      .eq("user_catalog_id", input.id)
      .select("status")
      .single();

    if (error) throw error;

    // Revalidate cache/tags
    revalidateTag("user_catalog");
    if (data?.status === input.status) revalidateTag("contacts-status-counts");

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function quickUpdateRecord(
  input: QuickUpdateContactSchema & { id: number }
) {
  unstable_noStore();
  try {
    const { data, error } = await postgrest.asAdmin()
      .from("user_catalog")
      .update({
        status: input.status,
      })
      .eq("user_catalog_id", input.id)
      .select("status")
      .single();

    if (error) throw error;

    // Revalidate cache/tags
    revalidateTag("user_catalog");
    if (data?.status === input.status) revalidateTag("contacts-status-counts");

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
  status?: Contact["status"];
}) {
  unstable_noStore();
  try {
    const { data, error } = await postgrest.asAdmin()
      .from("user_catalog")
      .update({
        status: input.status,
      })
      .in("user_catalog_id", input.ids)
      .select("status");

    if (error) throw error;

    // Revalidate cache/tags
    revalidateTag("user_catalog");
    if (data?.some((r) => r.status === input.status))
      revalidateTag("contacts-status-counts");

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
    const { error } = await postgrest.asAdmin()
      .from("user_catalog")
      .delete()
      .eq("user_catalog_id", input.id);

    if (error) throw error;

    // Revalidate cache/tags
    revalidateTag("user_catalog");
    revalidateTag("contacts-status-counts");

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
    const { error } = await postgrest.asAdmin()
      .from("user_catalog")
      .delete()
      .in("user_catalog_id", input.ids);

    if (error) throw error;

    // Revalidate cache/tags
    revalidateTag("user_catalog");
    revalidateTag("contacts-status-counts");

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}
