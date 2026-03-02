import { NextResponse } from "next/server";
import { auth, signOut } from "@/auth";        // ✅ use NextAuth server helpers
import { headers } from "next/headers";
import { extractIP, extractGeo, extractDevice } from "@/lib/deviceGeo";
import { postgrest } from "@/lib/postgrest";
import { logsDB } from "@/lib/admin";

export async function POST() {
  try {
    // ---------------------------
    // 1. Load server session
    // ---------------------------
    const session = await auth();

    if (!session?.user?.user_email) {
      return NextResponse.json({ status: "failed", message: "No session" });
    }

    const email = session.user.user_email;
    // ---------------------------
    // 2. Fetch full user record
    // ---------------------------
    const { data: user } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .select("*")
      .eq("user_email", email)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ status: "failed", message: "User not found" });
    }

    // ---------------------------
    // 3. Extract Headers / IP / Device
    // ---------------------------
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown";

    const ip = await extractIP(headersList);
    const geo = await extractGeo(ip);
    const device = extractDevice(userAgent);

    const logData = {
      status: "success",
      event_type: "logout_success",
      description: "Logout successful",

      // User
      user_id: user.user_catalog_id,
      user_name: user.user_name,
      user_email: user.user_email,
      full_name: user.full_name,
      user_mobile: user.user_mobile,
      role: "Store Manager",
      app_name: "amogaaiapps",

      // Network
      user_ip_address: ip,
      host_header: headersList.get("host") || "unknown",
      user_agent: userAgent,

      // Device
      browser: device.browser,
      operating_system: device.os,
      device: device.device,

      // GEO
      city: geo?.city,
      state: geo?.region,
      country: geo?.country,
      zip_code: geo?.postal,
      geo_location: geo ? `${geo.latitude},${geo.longitude}` : null,
      geo_meta: geo,

      // Business
      business_name: user.business_name,
      business_number: user.business_number,
      for_business_name: user.for_business_name,
      for_business_number: user.for_business_number,

      created_user: user.user_name,
      created_user_id: user.user_catalog_id,
      created_user_name: user.user_name,
    };

    // ---------------------------
    // 4. Save logs
    // ---------------------------
    await postgrest.asAdmin().from("user_log").insert(logData);
    await logsDB.from("user_log").insert(logData);

    // ---------------------------
    // 5. SignOut server-side
    // ---------------------------
    await signOut({ redirect: false });

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("Logout Error:", err);
    return NextResponse.json({ status: "failed" });
  }
}
