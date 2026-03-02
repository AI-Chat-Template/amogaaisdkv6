import shopify from "@/lib/shopify";
import { NextRequest, NextResponse } from "next/server";
import { PostgrestSessionStorage } from "@/lib/sessionStorage";

const sessionStorage = shopify.config
  .SESSION_STORAGE as PostgrestSessionStorage;

export async function GET(req: NextRequest) {
  try {
    // const { searchParams } = new URL(req.url);
    // const shop = searchParams.get('shop');
    // if (!shop) return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });

    const session_id = await shopify.session.getCurrentId({
      rawRequest: req,
      isOnline: false,
    });
    if (!session_id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.log("session_id", session_id);
    // Get the session from storage
    const session = await sessionStorage.loadSession(session_id);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Use the REST client with the loaded session
    const client = new shopify.clients.Rest({ session });
    const products = await client.get({ path: "products" });
    return NextResponse.json(products.body);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
