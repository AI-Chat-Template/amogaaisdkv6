import "server-only";
import { postgrest } from "@/lib/postgrest";
import { unstable_noStore } from "next/cache";
import { auth } from "@/auth";

export async function getRecords() {
  unstable_noStore();
  const session = await auth();
  try {
    const { data, error } = await postgrest
      .from("form_setup")
      .select("*")
      .eq("form_group", "Board")
      .filter("users_json", "cs", `["${session?.user?.user_email}"]`);
    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getSingleRecord(id: number) {
  unstable_noStore();
  try {
    const { data, error } = await postgrest
      .from("form_setup")
      .select("*")
      .eq("form_id", id);
    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}
