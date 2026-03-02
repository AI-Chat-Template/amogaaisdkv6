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
// ✅ GET - Get all coupons (with pagination support)
// -----------------------------
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log("[storcoupons] GET request started at", new Date().toISOString());
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const perPage = searchParams.get("per_page") || "100";
    const page = searchParams.get("page") || "1";

    let allCoupons: CouponData[] = [];
    let totalPages = 1;
    let currentPage = 1;

    console.log(`[storcoupons] Fetching coupons with perPage=${perPage}, initial page=${page}`);

    do {
      const pageStartTime = Date.now();
      const params = new URLSearchParams({
        per_page: perPage,
        page: String(currentPage),
      });

      console.log(`[storcoupons] Fetching page ${currentPage}...`);

      const response = await callWooCommerceAPI(
        `${baseCouponUrl}?${params.toString()}`,
        { method: "GET", cache: 60 } // Cache for 60 seconds
      );

      const pageDuration = Date.now() - pageStartTime;
      console.log(`[storcoupons] Page ${currentPage} fetched in ${pageDuration}ms`, response.success ? 'success' : 'failed');

      if (!response.success) {
        return NextResponse.json(
          { error: response.error || "Failed to fetch coupons" },
          { status: 500 }
        );
      }

      const data = (response.data || []) as CouponData[];
      allCoupons = [...allCoupons, ...data];
      totalPages = response.pages || 1;
      currentPage++;
    } while (currentPage <= totalPages);

    const totalDuration = Date.now() - startTime;
    console.log(`[storcoupons] Total fetch completed in ${totalDuration}ms, fetched ${allCoupons.length} coupons across ${totalPages} pages`);
    
    return NextResponse.json({ success: true, data: allCoupons });
  } catch (error: any) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// -----------------------------
// ✅ POST - Create a new coupon
// -----------------------------
export async function POST(request: NextRequest) {
  try {
    const body: CouponData = await request.json();

    const response = await callWooCommerceAPI(baseCouponUrl, {
      method: "POST",
      body,
    });

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to create coupon" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
