/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";

// WooCommerce Admin Credentials
const SITE_URL = "https://storesdemo.morr.biz";
const CONSUMER_KEY = "ck_a1b44e5da4b70b6f8ac41ac9a5c392265635087d";
const CONSUMER_SECRET = "cs_a3c6748f4192f32166758a522d048344aefdddb0";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Map your form to WooCommerce API payload
    const payload: any = {
      name: body.name,
      type: "simple",
      regular_price: body.regular_price?.toString(),
      sale_price: body.sale_price?.toString(),
      stock_quantity: body.stock_quantity ? Number(body.stock_quantity) : undefined,
      stock_status: body.stock_status || "instock",
      description: body.description,
      status: body.status || "publish",
      categories: body.categories?.map((id: number) => ({ id })) || undefined,
      images: body.image ? [{ src: body.image }] : undefined,
    };

    const authHeader = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");

    const res = await fetch(`${SITE_URL}/wp-json/wc/v3/products`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
      // WooCommerce returns JSON error text
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const product = JSON.parse(text);
    return NextResponse.json(product);
  } catch (err: any) {
    console.error("Product creation failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
