import { auth, signIn } from "@/auth";
import { PostgrestSessionStorage } from "@/lib/sessionStorage";
import shopify from "@/lib/shopify";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const nextSession = await auth();

    const { headers, session } = await shopify.auth.callback({
      rawRequest: req,
    });
    const sessionsByShop =
      await new PostgrestSessionStorage().findSessionsByShop(session?.shop);
    console.log("callback shopify seession", session);

    let shop_data;
    try {
      const adminClient = new shopify.clients.Rest({ session });
      const shopDetails = await adminClient.get({ path: "shop" });
      shop_data = shopDetails.body.shop || {};
    } catch {
      shop_data = {};
    }

    const setCookie = headers.get("Set-Cookie");

    if (nextSession && nextSession.user.business_number) {
      // User is logged in, check shopify_session by business_number
      const shopifySession =
        await new PostgrestSessionStorage().getShopifySessionByBusinessNumber(
          nextSession.user.business_number
        );
      if (shopifySession) {
        if (shopifySession.shop !== session.shop) {
          return NextResponse.json(
            {
              error: `You are connected to a different shop: ${shopifySession.shop}`,
              shop: shopifySession.shop,
            },
            { status: 403 }
          );
        }
        // else: continue, update session if needed
        await new PostgrestSessionStorage().storeSession({
          ...session,
          shop_data: shop_data,
        });
      } else {
        // No session found, store new session
        await new PostgrestSessionStorage().storeSession({
          ...session,
          business_number: nextSession.user.business_number,
          shop_data: shop_data,
        });
      }
      // Register webhooks and redirect as before
      const results = await shopify.webhooks.register({ session });
      Object.entries(results).forEach(([topic, response]) => {
        if (response[0] && response[0].success === true) {
          console.log(`Registered ${topic} webhook, shop : ${session.shop}`);
        } else {
          console.log(
            `Failed to register ${topic} webhook: ${response?.[0]?.result}, shop : ${session.shop}`
          );
        }
      });

      const host = process.env.NEXT_PUBLIC_APP_URL;
      const response = NextResponse.redirect(
        `${host}/${
          sessionsByShop && sessionsByShop.length > 0
            ? "role-menu"
            : "api/shopify/setup-finalization"
        }?shop=${session.shop}`
      );
      if (setCookie) {
        setCookie.split(",").forEach((cookie: string) => {
          response.headers.append("Set-Cookie", cookie.trim());
        });
      }
      return response;
    } else {
      if (sessionsByShop && sessionsByShop.length > 0) {
        const userId = sessionsByShop[0]?.installed_user_id;
        console.log("sessionsByShop[0]sessionsByShop[0]sessionsByShop[0]",sessionsByShop[0])
        if (!userId) {
          console.error("User ID is undefined. Cannot log in.");
          return NextResponse.json(
            { error: "User ID is missing for the session." },
            { status: 400 }
          );
        }
        console.log("Logging in with user ID:", userId);
        const loggedin = await signIn("user-id", { userId });
        console.log("loggedin", loggedin);

        await new PostgrestSessionStorage().storeSession({
          ...session,
          shop_data: shop_data,
        });
      }

      // Not logged in: store session and redirect to onboarding sign-in
      await new PostgrestSessionStorage().storeSession({
        ...session,
        shop_data: shop_data,
      });
      const host = process.env.NEXT_PUBLIC_APP_URL;
      const response = NextResponse.redirect(
        `${host}/storeonboard/signin?shop=${session.shop}`
      );
      if (setCookie) {
        setCookie.split(",").forEach((cookie: string) => {
          response.headers.append("Set-Cookie", cookie.trim());
        });
      }
      return response;
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error during authentication" },
      { status: 500 }
    );
  }
}
