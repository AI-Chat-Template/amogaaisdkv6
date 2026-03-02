"use server";

import { postgrest } from "@/lib/postgrest";

export async function getRoles() {
  const { data, error } = await postgrest.from("role_list").select("*");
  if (error) {
    throw new Error(error.message);
  }

  return data.map((role) => ({
    value: role.role_title,
    label: role.role_title,
  }));
}
