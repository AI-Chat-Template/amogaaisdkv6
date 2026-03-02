/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

// app/api/shopify/route.ts
export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const res = await fetch(
    "https://maxfoodstore.myshopify.com/admin/api/2024-07/graphql.json",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": process.env.NEXT_PUBLIC_SHOPIFY_ADMIN_API_ACCESS || "",
      },
      body: JSON.stringify({ query }),
    }
  );

  const json = await res.json();
  const flatData = flattenShopifyResponse(json.data);
  return NextResponse.json(flatData);
}

function flattenShopifyResponse(data: any): any[] {
  if (!data || typeof data !== "object") return [];

  const topKey = Object.keys(data)[0];
  const value = data[topKey];

  // Case 1: Relay style: { orders: { edges: [ { node: {...} } ] } }
  if (value?.edges && Array.isArray(value.edges)) {
    return value.edges.map((edge: any) => edge.node);
  }

  // Case 2: Plain object (e.g. { ordersCount: { count: 64 } })
  if (typeof value === "object" && !Array.isArray(value)) {
    return [value];
  }

  // Case 3: Already array
  if (Array.isArray(value)) {
    return value;
  }

  // Default fallback
  return [value];
}
