// app/api/store-sales-dashboard/getaiapi/route.ts
import { NextResponse } from "next/server";
import { getApiKey } from "@/app/(authenticated)/store-sales-dashboard/actions";

export async function GET() {
  try {
    // Call the server action
    const result = await getApiKey();

    if (!result || result.length === 0) {
      return NextResponse.json({ success: false, message: "No API key found" }, { status: 404 });
    }

    // ✅ Filter out sensitive fields before returning
    const safeKeys = result[0]?.aiapi_connection_json?.map((item: any) => ({
      provider: item.provider,
      model: item.model,
      default: item.default ?? false,
    })) ?? [];

    return NextResponse.json({ success: true, data: safeKeys });
  } catch (error) {
    console.error("Error fetching AI API key:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get AI API key" },
      { status: 500 }
    );
  }
}
