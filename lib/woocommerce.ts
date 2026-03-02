/* eslint-disable */
import { auth } from "@/auth";
import { postgrest } from "./postgrest";

type WooCommerceRequestOptions = {
  method?: string;
  body?: unknown;
  cache?: number;
  customHeaders?: Record<string, string>;
  businessNumber?: string;
  configuration?: Record<string, string>;
};

type WooCommerceResponse = {
  success: boolean;
  data: unknown;
  error?: string;
  pages?: number;
};

const callWooCommerceAPI = async (
  url: string,
  {
    method = "GET",
    body,
    cache = 0,
    customHeaders,
    businessNumber,
    configuration,
  }: WooCommerceRequestOptions = {}
): Promise<WooCommerceResponse> => {
  try {
    const session = await auth();

    const userCatalogId = session?.user?.user_catalog_id;
    const userBusinessNumber = businessNumber || session?.user?.business_number;

    if (!userCatalogId || !userBusinessNumber) {
      return {
        success: false,
        data: null,
        error: "User session or business number is missing.",
      };
    }

    // Fetch from user_catalog and get api_connection_json
    const { data: userCatalog, error: catalogError } = await postgrest
      .from("user_catalog")
      .select("api_connection_json")
      .eq("user_catalog_id", userCatalogId)
      .single();

    if (catalogError || !userCatalog) {
      return {
        success: false,
        data: null,
        error: catalogError?.message || "Failed to load user catalog.",
      };
    }

    // Pick WooCommerce config with apiname: "woocommerce" and status: "active"
    const woocommerceConfig = Array.isArray(userCatalog.api_connection_json)
      ? userCatalog.api_connection_json.find(
        (config: { apiname: string; status: string }) =>
          config.apiname === "woocommerce" && config.status === "active"
      )
      : null;

    if (!woocommerceConfig) {
      return {
        success: false,
        data: null,
        error: "Active WooCommerce configuration not found.",
      };
    }

    const siteUrl = woocommerceConfig.site_url?.replace(/\/+$/, "");

    if (!siteUrl) {
      return {
        success: false,
        data: null,
        error: "Site URL is missing in WooCommerce configuration.",
      };
    }

    const consumerKey = woocommerceConfig.consumer_key;
    const consumerSecret = woocommerceConfig.consumer_secret;

    const authHeader = btoa(`${consumerKey}:${consumerSecret}`);

    const storeIntegration = configuration || {
      api_name: woocommerceConfig.App_name || "woocommerce",
      base_url: `${siteUrl}/wp-json`,
      woo_consumer_key: consumerKey,
      woo_consumer_secret: consumerSecret,
      authorization: authHeader,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Basic ${storeIntegration.authorization}`,
      auth: "fdFSDFERfsdgd",
      ...(customHeaders || {}),
    };

    const fullUrl = `${storeIntegration.base_url}${url}`;
    const response = await fetch(fullUrl, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
      next: { revalidate: cache },
    });

    const responseText = await response.text();

    const isJson =
      responseText.trim().startsWith("{") ||
      responseText.trim().startsWith("[");
    const parsedData = isJson ? JSON.parse(responseText) : responseText;

    if (!response.ok) {
      console.error("Request failed", parsedData);
      return {
        success: false,
        data: parsedData,
        error: `Request failed with status ${response.status}`,
      };
    }

    const pages = response.headers.get("X-WP-TotalPages");

    return {
      success: true,
      data: parsedData,
      pages: pages ? parseInt(pages) : undefined,
    };
  } catch (error: unknown) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred.",
    };
  }
};

export default callWooCommerceAPI;
