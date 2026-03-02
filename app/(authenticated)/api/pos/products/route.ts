import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/app/(authenticated)/pointOfSale/actions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, search, page, per_page } = body;

    const result = await getProducts({ category, search, page, per_page });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        pages: result.pages || 1,
      });
    } else {
      return NextResponse.json({ success: false, error: result.error || "Failed to fetch products" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message || "Internal server error" }, { status: 500 });
  }
}
