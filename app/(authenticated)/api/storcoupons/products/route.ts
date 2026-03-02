import { NextRequest, NextResponse } from "next/server";
import callWooCommerceAPI from "@/lib/woocommerce";

// -----------------------------
// ✅ Types
// -----------------------------
export type Product = {
  id: number;
  name: string;
};

// -----------------------------
// ✅ Base URLs
// -----------------------------
const baseProductUrl = "/wc/v3/products";

// -----------------------------
// ✅ GET - Get all products (with pagination support)
// -----------------------------
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const perPage = searchParams.get("per_page") || "100";
    const page = searchParams.get("page") || "1";

    let allProducts: Product[] = [];
    let totalPages = 1;
    let currentPage = 1;

    do {
      const params = new URLSearchParams({
        per_page: perPage,
        page: String(currentPage),
      });

      const response = await callWooCommerceAPI(
        `${baseProductUrl}?${params.toString()}`,
        { method: "GET", cache: 300 } // Cache for 5 minutes - products don't change often
      );

      if (!response.success) {
        return NextResponse.json(
          { error: response.error || "Failed to fetch products" },
          { status: 500 }
        );
      }

      const data = (response.data || []) as any[];
      const products: Product[] = data.map((p) => ({
        id: p.id,
        name: p.name,
      }));

      allProducts = [...allProducts, ...products];
      totalPages = response.pages || 1;
      currentPage++;
    } while (currentPage <= totalPages);

    return NextResponse.json({ success: true, data: allProducts });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
