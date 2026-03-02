import { NextRequest, NextResponse } from "next/server";
import { getCustomers } from "@/app/(authenticated)/pointOfSale/actions";

export async function GET() {
  const result = await getCustomers();
  if (result.success) {
    return NextResponse.json({ success: true, data: result.data });
  } else {
    return NextResponse.json({ success: false, error: result.error || "Failed to fetch customers" }, { status: 500 });
  }
}
