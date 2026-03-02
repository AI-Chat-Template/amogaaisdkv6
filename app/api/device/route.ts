import { NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";

export async function GET(req: NextRequest) {
  // ===========================
  // 1. UNIVERSAL IP EXTRACTION
  // ===========================
  let ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() || // proxies, nginx
    req.headers.get("cf-connecting-ip") ||                      // Cloudflare, mobile
    req.headers.get("x-real-ip") ||                             // vercel/nginx
    req.headers.get("x-client-ip") ||                           // fallback
    req.headers.get("fastly-client-ip") ||                      // Fastly
    req.headers.get("true-client-ip") ||                        // Akamai
    req.headers.get("forwarded") ||                             // general fallback
    "";

  // If localhost or empty → fetch actual public IP
  if (
    !ip ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("0.") ||
    ip === "0.0.0.0"
  ) {
    try {
      const ext = await fetch("https://api.ipify.org?format=json", {
        cache: "no-store",
      }).then((r) => r.json());

      ip = ext.ip;
    } catch (err) {
      console.error("IP fallback failed", err);
    }
  }

  // ===========================
  // 2. UNIVERSAL GEO LOOKUP
  // ===========================
  let geo: any = {
    city: null,
    region: null,
    country: null,
    latitude: null,
    longitude: null,
    postal: null,
    isp: null,
    timezone: null,
  };

  try {
    const geoRes = await fetch(`https://ipwho.is/${ip}`, {
      cache: "no-store",
    });
    const geoData = await geoRes.json();

    if (geoData?.success) {
      geo = {
        city: geoData.city,
        region: geoData.region,
        country: geoData.country,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        postal: geoData.postal,
        isp: geoData.connection?.isp,
        timezone: geoData.timezone?.id,
      };
    }
  } catch (e) {
    console.error("Geo lookup failed", e);
  }

  // ===========================
  // 3. DEVICE / BROWSER PARSE
  // ===========================
  const uaString = req.headers.get("user-agent") || "";
  const parser = new UAParser(uaString);

  const parsed = {
    browser: parser.getBrowser(),
    os: parser.getOS(),
    device: {
      type: parser.getDevice().type || "desktop",
      vendor: parser.getDevice().vendor,
      model: parser.getDevice().model,
    },
    cpu: parser.getCPU(),
  };

  // ===========================
  // 4. RESPONSE (NO CACHE)
  // ===========================
  return NextResponse.json(
    {
      ip,
      geo,
      userAgent: uaString,
      parsed,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
