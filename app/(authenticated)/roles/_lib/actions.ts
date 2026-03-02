"use server";

import { type RoleList } from "../type";
import { revalidateTag, unstable_noStore } from "next/cache";
import type {
  CreateRoleListSchema,
  QuickUpdateRoleListSchema,
  UpdateRoleListSchema,
} from "./validations";
import { postgrest } from "@/lib/postgrest";
import { getErrorMessage } from "@/lib/handle-error";
import { UploadAttachment } from "@/lib/minio";

export async function createRecord(
  input: CreateRoleListSchema & { file?: File }
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

    const { data, error } = await postgrest.asAdmin()
      .from("role_list")
      .insert([
        {
          ...input,
          created_date: new Date().toISOString(),
        },
      ])
      .select("role_list_id")
      .single();

    if (error) throw error;

    revalidateTag("role_list");
    revalidateTag("role-list-status-counts");

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
  input: UpdateRoleListSchema & { id: number; file?: File }
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
    const { data, error } = await postgrest.asAdmin()
      .from("role_list")
      .update({
        ...rest,
      })
      .eq("role_list_id", id)
      .select("status")
      .single();

    if (error) throw error;

    revalidateTag("role_list");
    if (data?.status === input.status) revalidateTag("role-list-status-counts");

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function quickUpdateRecord(
  input: QuickUpdateRoleListSchema & { id: number }
) {
  unstable_noStore();
  try {
    const { data, error } = await postgrest.asAdmin()
      .from("role_list")
      .update({
        status: input.status,
      })
      .eq("role_list_id", input.id)
      .select("status")
      .single();

    if (error) throw error;

    revalidateTag("role_list");
    if (data?.status === input.status) revalidateTag("role-list-status-counts");

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
  status?: RoleList["status"];
}) {
  unstable_noStore();
  try {
    const { data, error } = await postgrest.asAdmin()
      .from("role_list")
      .update({
        status: input.status,
      })
      .in("role_list_id", input.ids)
      .select("status");

    if (error) throw error;

    revalidateTag("role_list");
    if (data?.some((r) => r.status === input.status))
      revalidateTag("role-list-status-counts");

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
      .from("role_list")
      .delete()
      .eq("role_list_id", input.id);

    if (error) throw error;

    revalidateTag("role_list");
    revalidateTag("role-list-status-counts");

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
      .from("role_list")
      .delete()
      .in("role_list_id", input.ids);

    if (error) throw error;

    revalidateTag("role_list");
    revalidateTag("role-list-status-counts");

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}
