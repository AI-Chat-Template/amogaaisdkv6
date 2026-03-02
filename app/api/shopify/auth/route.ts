import shopify from "@/lib/shopify";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");

  if (!shop) {
    return NextResponse.redirect("/login");
  }

  const authRoute = await shopify.auth.begin({
    rawRequest: req,
    isOnline: false,
    shop,
    callbackPath: "/api/shopify/callback",
  });

  console.log("Shopify auth Route", authRoute);

  const location = authRoute.headers.get("Location");
  const setCookie = authRoute.headers.get("Set-Cookie");

  if (location) {
    const response = NextResponse.redirect(location);
    
    if (setCookie) {
      setCookie.split(",").forEach((cookie: string) => {
        response.headers.append("Set-Cookie", cookie.trim());
      });
    }

    return response;
  }

  return NextResponse.json(
    { error: "Failed to generate auth route" },
    { status: 500 }
  );
}
