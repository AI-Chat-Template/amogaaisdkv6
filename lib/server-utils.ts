"use server";

import { User } from "next-auth";
import { postgrest } from "./postgrest";
import { auth } from "@/auth";

export async function getAllowedPaths(user: User) {
  try {
    const { data: pages_list, error } = await postgrest
      .from("page_list")
      .select("role_json,page_link");
 
    if (error) throw error;

    return pages_list
      .filter((page) =>
        ((page?.role_json as string[]) || [])?.some((role: string) =>
          user.roles_json?.includes(role)
        )
      )
      .map((p) => p.page_link);
  } catch {
    return [];
  }
}

export async function saveFcmToken(user_catalog_id: number, token: string) {
  console.log("saveFcmToken, user_id", user_catalog_id)
  const { data, error } = await postgrest
    .asAdmin()
    .from("user_catalog")
    .update({
      fcm_token: token,
    })
    .eq("user_catalog_id", user_catalog_id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getUserServerSession() {
  const session = await auth();
  if (!session) return { session: null, status: "unauthenticated" };
  return { session, status: "authenticated" };
}