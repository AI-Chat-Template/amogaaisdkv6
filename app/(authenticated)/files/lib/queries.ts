import { postgrest } from "@/lib/postgrest";
import "server-only";

export async function getFiles() {
  try {
    const { data, error } = await postgrest.from("file_upload").select("*");
    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getFileData(id: number) {
  try {
    const { data, error } = await postgrest
      .from("file_upload")
      .select("*")
      .eq("file_upload_id", id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}
