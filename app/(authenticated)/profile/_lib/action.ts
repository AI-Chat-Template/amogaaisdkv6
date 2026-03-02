"use server";

import { unstable_noStore, revalidateTag } from "next/cache";
import { postgrest } from "@/lib/postgrest";
import { auth } from "@/auth";
import { getErrorMessage } from "@/lib/handle-error";
import { createHash } from "node:crypto";

const PROFILE_TAG = "profile";
const PROFILE_BUSINESS_TAG = "profile-business";

export type BusinessPayload = {
  business_name?: string | null;
  business_number?: string | null;
  business_address_1?: string | null;
  business_address_2?: string | null;
  business_city?: string | null;
  business_state?: string | null;
  business_postcode?: string | null;
  business_country?: string | null;
};

export type ActionResult<T> = { data: T | null; error: string | null };

export async function getProfile(): Promise<ActionResult<any>> {
  unstable_noStore();
  try {
    const session = await auth();
    if (!session?.user?.user_email) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await postgrest
      .from("user_catalog")
      .select(
        [
          "user_email",
          "first_name",
          "last_name",
          "full_name",
          "user_mobile",
          "status",
          "roles_json",
          "avatar_url",
          "business_name",
          "business_number",
          "for_business_name",
          "for_business_number",
          "business_address_1",
          "business_address_2",
          "business_city",
          "business_state",
          "business_postcode",
          "business_country",
        ].join(", ")
      )
      .eq("user_email", session.user.user_email)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}

export async function updateBusiness(input: BusinessPayload): Promise<ActionResult<any>> {
  unstable_noStore();
  try {
    const session = await auth();
    if (!session?.user?.user_email) return { data: null, error: "Not authenticated" };

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if ("business_name" in input) {
      updates.business_name = input.business_name ?? null;
      updates.for_business_name = input.business_name ?? null;
    }
    if ("business_number" in input) {
      updates.business_number = input.business_number ?? null;
      updates.for_business_number = input.business_number ?? null;
    }
    if ("business_address_1" in input) updates.business_address_1 = input.business_address_1 ?? null;
    if ("business_address_2" in input) updates.business_address_2 = input.business_address_2 ?? null;
    if ("business_city" in input) updates.business_city = input.business_city ?? null;
    if ("business_state" in input) updates.business_state = input.business_state ?? null;
    if ("business_postcode" in input) updates.business_postcode = input.business_postcode ?? null;
    if ("business_country" in input) updates.business_country = input.business_country ?? null;

    const { data, error } = await postgrest
      .from("user_catalog")
      .update(updates)
      .eq("user_email", session.user.user_email)
      .select(
        [
          "business_name",
          "business_number",
          "for_business_name",
          "for_business_number",
          "business_address_1",
          "business_address_2",
          "business_city",
          "business_state",
          "business_postcode",
          "business_country",
        ].join(", ")
      )
      .single();

    if (error) throw error;

    revalidateTag(PROFILE_TAG);
    revalidateTag(PROFILE_BUSINESS_TAG);

    return { data, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}

export async function updateAvatarUrl(input: { avatar_url: string }): Promise<ActionResult<{ avatar_url: string | null }>> {
  unstable_noStore();
  try {
    const session = await auth();
    if (!session?.user?.user_email) return { data: null, error: "Not authenticated" };

    const { data, error } = await postgrest
      .from("user_catalog")
      .update({ avatar_url: input.avatar_url, updated_at: new Date().toISOString() })
      .eq("user_email", session.user.user_email)
      .select("avatar_url")
      .single();

    if (error) throw error;

    revalidateTag(PROFILE_TAG);

    return { data: data ? { avatar_url: data.avatar_url ?? null } : null, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}

export async function uploadAvatarToCloudinary(input: { fileName: string; type: string; base64: string }) {
  try {
    const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
    const API_KEY = process.env.CLOUDINARY_API_KEY!;
    const API_SECRET = process.env.CLOUDINARY_API_SECRET!;
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) throw new Error("Cloudinary env missing");

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "avatars";
    const publicId = input.fileName.replace(/\.[^/.]+$/, "");

    const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = createHash("sha1").update(toSign).digest("hex");

    const form = new FormData();
    form.set("file", `data:${input.type || "image/jpeg"};base64,${input.base64}`);
    form.set("api_key", API_KEY);
    form.set("timestamp", String(timestamp));
    form.set("signature", signature);
    form.set("folder", folder);
    form.set("public_id", publicId);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: form as any,
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.secure_url) {
      throw new Error(json?.error?.message || `Cloudinary upload failed: ${res.status}`);
    }

    return { url: json.secure_url };
  } catch (err) {
    return { url: null, error: getErrorMessage(err) };
  }
}

export async function handleAvatarUpload(input: { fileName: string; type: string; base64: string }): Promise<ActionResult<{ avatar_url: string | null }>> {
  const uploaded = await uploadAvatarToCloudinary(input);
  if (uploaded.error || !uploaded.url) return { data: null, error: uploaded.error || "Upload failed" };

  const res = await updateAvatarUrl({ avatar_url: uploaded.url });
  return res;
}
