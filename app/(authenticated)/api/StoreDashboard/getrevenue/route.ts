import { NextResponse } from "next/server";
import { getRevenueReportsData } from "@/app/(authenticated)/store-sales-dashboard/actions";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { success: false, message: "Missing 'from' or 'to' date parameters." },
        { status: 400 }
      );
    }

    const result = await getRevenueReportsData(from, to);

    if (result?.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.success,
    });
  } catch (error) {
    console.error("Error fetching revenue report:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error fetching revenue data." },
      { status: 500 }
    );
  }
}
