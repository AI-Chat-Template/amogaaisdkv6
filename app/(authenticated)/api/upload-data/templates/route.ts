import { NextResponse } from "next/server";
import { postgrest } from "@/lib/postgrest";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const data_upload_group = url.searchParams.get("data_upload_group");

    if (!data_upload_group) {
      return NextResponse.json(
        { success: false, error: "Missing data_upload_group" },
        { status: 400 }
      );
    }

    const { data, error } = await postgrest
      .from("data_upload_setup")
      .select(
        "data_upload_setup_id, template_name, data_table_name, template_file_fields_json, file_csv_field_json"
      )
      .eq("data_upload_group", data_upload_group);

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
