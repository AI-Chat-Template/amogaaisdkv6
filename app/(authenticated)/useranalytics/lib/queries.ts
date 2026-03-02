/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { postgrest } from "@/lib/postgrest";

export async function getDataFromApi(apiUrl: any) {
  try {
    const { data, error } = await postgrest.from(apiUrl).select("*");
    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getJsonFromPageList() {
  try {
    const { data, error } = await postgrest
      .from("page_list")
      .select("*")
      .eq("page_group", "Board");
    if (error) throw error;
    return data?.map((page) => page.board_json);
  } catch (error) {
    throw error;
  }
}
