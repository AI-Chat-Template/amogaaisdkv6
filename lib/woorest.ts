import { auth } from "@/auth";
import { postgrest } from "./postgrest";

const woorest = async (
  url: string,
  method: string = "GET",
  body?: unknown,
  cache?: number,
  custom_headers?: Record<string, string>,
  business_number?: string,
  configuration?: Record<string, string>
): Promise<unknown> => {
  const session = await auth();

  if (!session?.user?.user_catalog_id) {
    throw new Error("User session or user_catalog_id not found");
  }

  // Fetch ai_provider_key from business_settings using business_number
  const { data: businessSettings, error: businessError } = await postgrest
    .from("business_settings" as "user_catalog")
    .select("ai_provider_key")
    .eq("business_number", session.user.business_number)
    .single();

  if (businessError || !businessSettings) {
    throw new Error(businessError?.message || "Failed to load business settings.");
  }

  // Fetch user_catalog for api_connection_json by user_catalog_id
  const { data: userCatalog, error: userCatalogError } = await postgrest
    .from("user_catalog")
    .select("api_connection_json")
    .eq("user_catalog_id", session.user.user_catalog_id)
    .single();

  if (userCatalogError || !userCatalog) {
    throw new Error(userCatalogError?.message || "Failed to load user catalog data.");
  }

  // Find active WooCommerce config from api_connection_json
  const woocommerceConfig = userCatalog.api_connection_json?.find(
    (config: { apiname: string; status: string }) =>
      config.apiname.toLowerCase() === "woocommerce" && config.status.toLowerCase() === "active"
  );

  if (!woocommerceConfig) {
    throw new Error("No active WooCommerce configuration found in user_catalog.api_connection_json");
  }

  // Normalize site_url
  const siteUrl: string = woocommerceConfig.site_url.replace(/\/+$/, "");

  // Build store integration config, allow override via configuration param
  const store_integration = configuration || {
    api_name: woocommerceConfig.apiname,
    base_url: siteUrl + "/wp-json",
    woo_consumer_key: woocommerceConfig.consumer_key,
    woo_consumer_secret: woocommerceConfig.consumer_secret,
    authorization: btoa(
      woocommerceConfig.consumer_key + ":" + woocommerceConfig.consumer_secret

    ),
  };

  // Default headers with Basic Auth
  const default_headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Basic ${store_integration.authorization}`,
  };

  // Compose fetch options
  const options: RequestInit = {
    method,
    headers: custom_headers ? { ...default_headers, ...custom_headers } : default_headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: cache ? cache : 0 },
  };

  // Make the fetch to WooCommerce API
  const response = await fetch(`${store_integration.base_url}${url}`, options);
  const responseBody = await response.text();

  console.log("Request URL:", `${store_integration.base_url}${url}`);
  console.log("WooCommerce API response:", responseBody);

  if (!response.ok) {
    console.error("Response error URL", response.url, "Response body", responseBody);
    throw new Error(responseBody);
  }

  if (responseBody.trim() !== "") {
    try {
      return JSON.parse(responseBody);
    } catch (error) {
      console.error("Error parsing response as JSON:", error);
      return responseBody;
    }
  } else {
    console.error("Empty response body");
    return null;
  }
};

export default woorest;
