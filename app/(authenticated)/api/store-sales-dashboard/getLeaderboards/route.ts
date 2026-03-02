import { NextResponse } from "next/server";
import { getLeaderboardsData } from "@/app/(authenticated)/store-sales-dashboard/actions";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json({ success: false, message: "Missing date range" }, { status: 400 });
    }

    const result = await getLeaderboardsData(from, to);
    if (result?.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.success });
  } catch (error) {
    console.error("Error in getleaderboards:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
