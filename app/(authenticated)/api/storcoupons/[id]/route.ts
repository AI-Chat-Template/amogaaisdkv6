import { NextRequest, NextResponse } from "next/server";
import callWooCommerceAPI from "@/lib/woocommerce";

// -----------------------------
// ✅ Types
// -----------------------------
export type CouponData = {
  id?: number;
  code: string;
  amount: string;
  status?: string;
  date_created?: string;
  date_modified?: string;
  discount_type: "fixed_cart" | "percent" | "fixed_product";
  description?: string;
  date_expires?: string;
  usage_limit_per_user?: number;
  free_shipping?: boolean;
  product_ids?: number[];
  exclude_sale_items?: boolean;
  minimum_amount?: string;
  maximum_amount?: string;
  email_restrictions?: string[];
  individual_use?: boolean;
};

// -----------------------------
// ✅ Base URLs
// -----------------------------
const baseCouponUrl = "/wc/v3/coupons";

// -----------------------------
// Helper to parse coupon ID from URL
// -----------------------------
function getCouponIdFromUrl(url: string): number | null {
  const match = url.match(/\/api\/storcoupons\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// -----------------------------
// ✅ GET - Get single coupon by ID
// -----------------------------
export async function GET(request: NextRequest) {
  try {
    const couponId = getCouponIdFromUrl(request.url);

    if (!couponId) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    const response = await callWooCommerceAPI(
      `${baseCouponUrl}/${couponId}?_=${Date.now()}`,
      { method: "GET", cache: 30 } // Cache for 30 seconds
    );

    if (!response.success || !response.data) {
      return NextResponse.json(
        { error: response.error || "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    console.error(`Error fetching coupon:`, error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// -----------------------------
// ✅ PUT - Update coupon by ID
// -----------------------------
export async function PUT(request: NextRequest) {
  try {
    const couponId = getCouponIdFromUrl(request.url);

    if (!couponId) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    const body: Partial<CouponData> = await request.json();

    // Clean up the data
    const cleaned = {
      ...body,
      date_expires: body.date_expires
        ? new Date(body.date_expires).toISOString().split("T")[0]
        : undefined,
      minimum_amount: body.minimum_amount
        ? String(Number(body.minimum_amount))
        : "",
      maximum_amount: body.maximum_amount
        ? String(Number(body.maximum_amount))
        : "",
    };

    const response = await callWooCommerceAPI(`${baseCouponUrl}/${couponId}`, {
      method: "PUT",
      body: cleaned,
    });

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to update coupon" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// -----------------------------
// ✅ DELETE - Delete coupon by ID
// -----------------------------
export async function DELETE(request: NextRequest) {
  try {
    const couponId = getCouponIdFromUrl(request.url);

    if (!couponId) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    const response = await callWooCommerceAPI(`${baseCouponUrl}/${couponId}`, {
      method: "DELETE",
    });

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to delete coupon" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
