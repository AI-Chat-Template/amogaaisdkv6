import { UAParser } from "ua-parser-js";

/** Server Action safe public IP lookup - Uses PASSED headers only */
export async function extractIP(headersList?: Headers) {
  try {
    // REQUIRED: Must pass headersList from Server Action
    if (!headersList) {
      return "0.0.0.0"; // No headers = no IP
    }
    
    // Vercel/Cloudflare real client IP headers (priority order)
    const forwardedFor = headersList.get("x-forwarded-for");
    const cfConnectingIP = headersList.get("cf-connecting-ip");
    const realIP = headersList.get("x-real-ip");
    const trueIP = headersList.get("x-true-ip");

    // Extract FIRST IP from forwarded-for chain (real client)
    let clientIP = forwardedFor?.split(",")[0]?.trim() ||
                   cfConnectingIP ||
                   realIP ||
                   trueIP;

    // Validate IP (not loopback/private)
    if (clientIP && 
        !clientIP.includes("127.0.0.1") && 
        !clientIP.includes("::1") && 
        !clientIP.startsWith("10.") && 
        !clientIP.startsWith("172.") && 
        !clientIP.startsWith("192.168.")) {
      return clientIP;
    }

    // FINAL FALLBACK: External API
    const res = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store",
    });
    return (await res.json()).ip || "0.0.0.0";
  } catch {
    return "0.0.0.0";
  }
}

/** GEO lookup */
export async function extractGeo(ip: string) {
  try {
    const res = await fetch(`https://ipwho.is/${ip}`, { cache: "no-store" });
    const json = await res.json();
    if (!json.success) return null;

    return {
      city: json.city,
      region: json.region,
      country: json.country,
      latitude: json.latitude,
      longitude: json.longitude,
      postal: json.postal,
      isp: json.connection?.isp,
      timezone: json.timezone?.id,
    };
  } catch {
    return null;
  }
}

/** Device parsing */
export function extractDevice(ua: string) {
  if (!ua || ua.trim() === "") ua = "Unknown";

  const parser = new UAParser(ua);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const dev = parser.getDevice();

  return {
    browser: browser.name || "Unknown",
    os: os.name || "Unknown",
    device: dev.type || "desktop",
    raw: ua,
  };
}
