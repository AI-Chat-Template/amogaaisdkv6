import { NextResponse } from "next/server";

// Server-side only - keys are never exposed to client
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || "lytyl.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

// Validate environment variables at runtime
if (!SHOPIFY_ACCESS_TOKEN) {
  console.error("SHOPIFY_ADMIN_ACCESS_TOKEN is not configured");
}

export async function GET() {
  try {
    // Validate token exists
    if (!SHOPIFY_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Shopify configuration error" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://${SHOPIFY_SHOP}/admin/api/2025-01/products.json?limit=50`,
      {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
        // Cache the Shopify API response for 60 seconds
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Shopify API error:", response.status, errorData);
      return NextResponse.json(
        { error: "Failed to fetch products from Shopify" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}