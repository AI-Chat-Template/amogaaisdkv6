"use server";

import { auth, signOut } from "@/auth";
import { postgrest } from "@/lib/postgrest";
import { extractIP, extractGeo, extractDevice } from "@/lib/deviceGeo";
import { headers } from "next/headers";

export async function logoutAction() {
  const session = await auth();
  if (!session?.user) return;

  const user = session.user;

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "Unknown";
  const ip = await extractIP(headersList);
  const geo = await extractGeo(ip);
  const device = extractDevice(userAgent);

  await postgrest.asAdmin().from("user_log").insert({
    status: "success",
    event_type: "logout",
    description: "User signed out",

    user_id: user.user_catalog_id,
    user_name: user.user_name,
    user_email: user.user_email,
    full_name: user.full_name ?? "",
    user_mobile: user.user_mobile,
    role_json: user.roles_json,

    user_ip_address: ip,
    host_header: headersList.get("host") || "unknown",
    user_agent: userAgent,

    browser: device.browser,
    operating_system: device.os,
    device: device.device,

    city: geo?.city,
    state: geo?.region,
    country: geo?.country,
    zip_code: geo?.postal,
    geo_location: geo ? `${geo.latitude},${geo.longitude}` : null,
    geo_meta: geo,

    created_user: user.user_name,
    created_user_id: user.user_catalog_id,
    created_user_name: user.full_name ?? "",
  });

  // server-side logout only
  await signOut({ redirect: false });

  return true; // return something so client knows it completed
}
