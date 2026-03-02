"use server";

import { auth } from "@/auth";
import { postgrest } from "@/lib/postgrest";

export async function getRoles() {
  const session = await auth();
  const { data, error } = await postgrest
    .from("role_list")
    .select("*")
    .eq("business_number", session?.user.business_number || "no_session");
  if (error) {
    throw new Error(error.message);
  }

  return data.map((role) => ({
    value: role.role_title,
    label: role.role_title,
  }));
}
