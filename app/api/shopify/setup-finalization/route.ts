import { saveConnectionSettings } from "@/app/(authenticated)/businesssettings/actions";
import { auth } from "@/auth";
import { postgrest } from "@/lib/postgrest";
import { PostgrestSessionStorage } from "@/lib/sessionStorage";
import shopify from "@/lib/shopify";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const nextSession = await auth();

    const session_id = await shopify.session.getCurrentId({
      rawRequest: req,
      isOnline: false,
    });
    if (!session_id)
      return NextResponse.json(
        { error: "Unauthorized Shopify shop" },
        { status: 401 }
      );

    // Get the session from storage
    const session = await new PostgrestSessionStorage().loadSession(session_id);
    console.log("setup finalization shopify session", session);
    if (!session || !nextSession?.user.business_number)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const alreadyLinkedToShop =
      await new PostgrestSessionStorage().getShopifySessionByBusinessNumber(
        nextSession.user.business_number
      );

    if (alreadyLinkedToShop && alreadyLinkedToShop.shop !== session.shop) {
      return NextResponse.json(
        {
          error: `You are connected to a different shop: ${alreadyLinkedToShop.shop}`,
          shop: session.shop,
        },
        { status: 403 }
      );
    }

    // await new PostgrestSessionStorage().updateShopifySessionBusinessNumber(
    //   session.shop,
    //   nextSession.user.business_number
    // );

    await new PostgrestSessionStorage().storeSession({
      ...session,
      business_number: nextSession.user.business_number,
      installed_user: nextSession?.user.user_email,
      installed_user_id: nextSession?.user.user_catalog_id,
    });

    if (!session.accessToken || !process.env.SHOPIFY_API_SECRET_KEY) {
      return NextResponse.json(
        { error: "There is missing information to setup n8n workflow" },
        { status: 500 }
      );
    }

    console.log("config", {
      platform: "shopify",
      autoConfigured: true,
      settings: {
        shop_subdomain: session.shop.split(".")[0],
        access_token: session.accessToken,
        app_secret_key: process.env.SHOPIFY_API_SECRET_KEY,
      },
    });
    // set up shopify n8n webhooks
    await saveConnectionSettings({
      platform: "shopify",
      autoConfigured: true,
      settings: {
        shop_subdomain: session.shop.split(".")[0],
        access_token: session.accessToken,
        app_secret_key: process.env.SHOPIFY_API_SECRET_KEY,
      },
    });

    await postgrest
      .asAdmin()
      .from("user_catalog")
      .update({
        business_name: nextSession.user?.business_name,
        legal_business_name: "",
        business_number: nextSession.user?.business_number || "",
        business_registration_no:
          nextSession.user?.business_registration_no || "",
        store_name: session?.shop_data?.name || "",
        store_url: session?.shop_data?.domain || "",
        store_email: session?.shop_data?.email || "",
        store_mobile: session?.shop_data?.phone || "",
      })
      .eq("user_catalog_id", nextSession.user.user_catalog_id);

    const host = process.env.NEXT_PUBLIC_APP_URL;
    // const response = NextResponse.redirect(
    //   `${host}/api/shopify/products?shop=${session.shop}`
    // );
    const response = NextResponse.redirect(
      `${host}/role-menu?shop=${session.shop}`
    );
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error during setup finalization" },
      { status: 500 }
    );
  }
}
