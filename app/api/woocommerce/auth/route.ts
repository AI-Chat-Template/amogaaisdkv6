import { saveConnectionSettings } from "@/app/(authenticated)/businesssettings/actions";
import { signIn } from "@/auth";
import { postgrest } from "@/lib/postgrest";
import { NextRequest, NextResponse } from "next/server";

async function validateNonce(url, email, token) {
  const wooResponse = await fetch(url + "/wp-json/custom/v1/validate_nonce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token }),
  });

  const wooData = await wooResponse.json();
  console.log("wooData", wooData);
  return wooData;
}

async function GetWooKeys(url, email, token) {
  const wooResponse = await fetch(url + "/wp-json/custom/v1/generate-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token }),
  });

  const wooData = await wooResponse.json();
  console.log("wooData", wooData);
  return wooData;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const home_url = searchParams.get("home_url");

  if (!email || !token || !home_url) {
    return NextResponse.json(
      { error: "Misiing required params" },
      { status: 404 }
    );
  }

  const valid = await validateNonce(home_url, email, token);

  if (!valid) {
    return NextResponse.json(
      { error: "unvalid creditintial" },
      { status: 500 }
    );
  }

  // Check if user email exists
  const { data: existingUser } = await postgrest
    .from("user_catalog")
    .select("*")
    .eq("user_email", email)
    .single();

  let businessNumber;

  if (!existingUser) {
    // Create new user and set business number as current timestamp and random 4 digits
    businessNumber = `${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
    const { error: userCreationError } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .insert({
        user_email: email,
        business_number: businessNumber,
      });

    if (userCreationError) {
      return NextResponse.json(
        { error: "Failed to create new user" },
        { status: 500 }
      );
    }
  } else {
    businessNumber = existingUser.business_number;
  }

  const loggedin = await signIn("email-login", { email, redirect: false });
  console.log("loggedin", loggedin);

  // Check if WooCommerce credentials exist in business_settings
  const { data: businessSettings } = await postgrest
    .from("business_settings")
    .select("data_source_json")
    .eq("business_number", businessNumber)
    .single();

  const wooConfig = businessSettings?.data_source_json?.find(
    (config) => config.platform_type === "woocommerce"
  );

  if (!wooConfig) {
    // Get WooCommerce keys and save in business_settings
    const wooKeys = await GetWooKeys(home_url, email, token);

    const updatedSettings = await saveConnectionSettings({
      platform: "woocommerce",
      autoConfigured: true,
      settings: {
        site_url: home_url,
        consumer_key: wooKeys.consumer_key,
        consumer_secret: wooKeys.consumer_secret,
      },
    },"", businessNumber);

    // const updatedSettings = businessSettings?.data_source_json
    //   ? [...businessSettings.data_source_json, newWooConfig]
    //   : [newWooConfig];

    // const { error: settingsUpdateError } = await postgrest
    //   .from("business_settings")
    //   .update({ data_source_json: updatedSettings })
    //   .eq("business_number", businessNumber);

    if (!updatedSettings || !updatedSettings?.success) {
      return NextResponse.json(
        { error: "Failed to save WooCommerce credentials" },
        { status: 500 }
      );
    }
  }

  // Log in the user with the email and redirect to /wp
  const loginUrl = new URL("/wp", req.nextUrl.origin);
  loginUrl.searchParams.append("email", email);

  return NextResponse.redirect(loginUrl);
}
