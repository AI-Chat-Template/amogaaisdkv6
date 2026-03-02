import { NextResponse } from "next/server";
import { createOrder } from "@/app/(authenticated)/pointOfSale/actions"; // adjust import path if needed

export async function POST(req: Request) {
  try {
    const orderData = await req.json();

    // Basic validation
    if (!orderData.line_items || orderData.line_items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must include at least one item" },
        { status: 400 }
      );
    }

    const result = await createOrder(orderData);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error creating order" },
      { status: 500 }
    );
  }
}
