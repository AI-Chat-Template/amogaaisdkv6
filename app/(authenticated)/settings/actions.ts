"use server";

import { auth } from "@/auth";
import { n8n } from "@/lib/n8n";
import { postgrest } from "@/lib/postgrest";
import { revalidatePath } from "next/cache";

// Represents configuration for a SINGLE platform
export interface StandardApiConfig {
  id: string;
  apiName: string;
  appName: string;
  apiUrl: string;
  apiSecret: string;
  apiKey: string;
}
export interface DataSourceConfig {
  platform_type: "shopify" | "woocommerce";
  status: "active" | "inactive" | "error" | "pending";
  autoConfigured?: boolean;
  error_message?: string;
  last_data_sync_date?: string;
  n8n_credential_id?: string;
  n8n_workflow_id?: string;
  credentials: {
    shopify?: NonNullable<DataSourceConfigBase["credentials"]["shopify"]>;
    woocommerce?: NonNullable<DataSourceConfigBase["credentials"]["woocommerce"]>;
  };
  last_tested_date?: string;
  created_at?: string;
  updated_at?: string;
  remarks?: string;
}

interface DataSourceConfigBase {
  credentials: {
    shopify?: {
      shop_subdomain: string;
      access_token: string;
      app_secret_key: string;
    };
    woocommerce?: {
      site_url: string;
      consumer_key: string;
      consumer_secret: string;
    };
  };
}

export type PlatformSettingsPayload =
  | {
    platform: "shopify";
    autoConfigured: boolean;
    settings: NonNullable<DataSourceConfigBase["credentials"]["shopify"]>;
  }
  | {
    platform: "woocommerce";
    autoConfigured: boolean;
    settings: NonNullable<DataSourceConfigBase["credentials"]["woocommerce"]>;
  }
  | {
    platform: "ai";
    settings: { provider: string; apiKey: string };
  };

// Fetch the array of configurations
export async function getConnectionSettings(
  business_number?: string
): Promise<{ data?: DataSourceConfig[] | null; error?: string } | null> {
  try {
    const sessions = await auth();
    const businessNumber = sessions?.user?.business_number || business_number;

    if (!businessNumber) {
      throw new Error("Cannot get the user session business_number");
    }
    const { data, error } = await postgrest
      .from("business_settings" as any) // Fix: cast as any if type error
      .select("data_source_json")
      .eq("business_number", businessNumber)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Postgrest error fetching settings:", error);
      throw new Error(error.message);
    }

    const settingsData = data?.data_source_json as DataSourceConfig[] | null;
    return { data: settingsData };
  } catch (error) {
    console.error("Error getting connection settings:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to get connection settings",
    };
  }
}

// Test connection for a single platform
export async function testConnection(
  payload: PlatformSettingsPayload
): Promise<{ success: boolean; message: string }> {
  console.log("🔍 Testing connection for:", payload.platform, payload.settings);

  try {
    if (payload.platform === "shopify") {
      return await n8n.testShopifyConnection(
        payload.settings.shop_subdomain,
        payload.settings.access_token
      );
    } else if (payload.platform === "woocommerce") {
      return await n8n.testWooCommerceConnection(
        payload.settings.site_url,
        payload.settings.consumer_key,
        payload.settings.consumer_secret
      );
    } else {
      return {
        success: false,
        message: "Connection test not supported for this platform.",
      };
    }
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Connection test failed",
    };
  }
}

// Save/Update settings for a SINGLE platform within the array
export async function saveConnectionSettings(
  payload: PlatformSettingsPayload,
  remarks?: string,
  business_number?: string
): Promise<{ success: boolean; message: string; data?: DataSourceConfig[] }> {
  console.log("🟦 Starting saveConnectionSettings:", {
    platform: payload.platform,
    remarks,
  });

  try {
    const sessions = await auth();
    const businessNumber = sessions?.user?.business_number || business_number;
    if (!businessNumber) {
      console.log("❌ Auth Error: No business number found in session");
      throw new Error("Cannot get the user session business_number");
    }

    console.log("📝 Fetching existing settings...");
    const result = await getConnectionSettings(businessNumber);
    const existingConfigsArray = result?.data;
    const fetchError = result?.error;
    if (fetchError) {
      console.log("❌ Failed to fetch existing settings:", fetchError);
      throw new Error(`Failed to fetch existing settings: ${fetchError}`);
    }

    const currentConfigs: DataSourceConfig[] = existingConfigsArray || [];
    // Only handle shopify/woocommerce for DataSourceConfig
    if (payload.platform === "shopify" || payload.platform === "woocommerce") {
      const existingConfig = currentConfigs.find(
        (c) => c.platform_type === payload.platform
      );

      const newConfigData: DataSourceConfig = {
        platform_type: payload.platform,
        status: "pending",
        autoConfigured: (payload as any).autoConfigured || false,
        credentials: {
          [payload.platform]: payload.settings,
        },
        updated_at: new Date().toISOString(),
        remarks,
        last_tested_date: undefined,
        error_message: undefined,
        created_at: existingConfig?.created_at || new Date().toISOString(),
      };

      const updatedConfigs = existingConfig
        ? currentConfigs.map((c) =>
          c.platform_type === payload.platform ? newConfigData : c
        )
        : [...currentConfigs, newConfigData];

      console.log("📤 Saving to database...");
      const { data, error } = await postgrest
        .from("business_settings" as any)
        .upsert(
          {
            business_number: businessNumber,
            data_source_json: updatedConfigs,
          },
          { onConflict: "business_number" }
        )
        .select("data_source_json")
        .single();

      if (error) {
        console.log("❌ Database save error:", error);
        throw new Error(`Failed to save settings: ${error.message}`);
      }

      console.log("✅ Save operation completed successfully");
      return {
        success: true,
        message: `${payload.platform} settings saved and n8n integration configured successfully.`,
        data: data.data_source_json as DataSourceConfig[],
      };
    } else {
      // AI settings are handled separately
      return {
        success: false,
        message: "Use saveAISettings for AI platform.",
      };
    }
  } catch (error) {
    console.log("❌ Final error in saveConnectionSettings:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unknown error occurred while saving settings.",
    };
  }
}




// Save AI settings separately
export async function saveAISettings(
  provider: string,
  apiKey: string,
  business_number?: string
): Promise<{ success: boolean; message: string }> {
  console.log("🟦 Starting saveAISettings:", { provider, apiKey });

  try {
    const sessions = await auth();
    const businessNumber = sessions?.user?.business_number || business_number;
    if (!businessNumber) {
      console.log("❌ Auth Error: No business number found in session");
      throw new Error("Cannot get the user session business_number");
    }

    console.log("📤 Saving AI settings to database...");
    const { error } = await postgrest.from("business_settings" as any).upsert(
      {
        business_number: businessNumber,
        ai_provider_key: { provider, apiKey },
      },
      { onConflict: "business_number" }
    );

    if (error) {
      console.log("❌ Database save error:", error);
      throw new Error(`Failed to save AI settings: ${error.message}`);
    }

    console.log("✅ AI settings saved successfully");
    return {
      success: true,
      message: "AI settings saved successfully.",
    };
  } catch (error) {
    console.log("❌ Final error in saveAISettings:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unknown error occurred while saving AI settings.",
    };
  }
}

// Load AI settings
export async function loadAISettings(
  business_number?: string
): Promise<{ provider: string; apiKey: string } | null> {
  console.log("🔍 Loading AI settings...");

  try {
    const sessions = await auth();
    const businessNumber = sessions?.user?.business_number || business_number;

    if (!businessNumber) {
      console.log("❌ Auth Error: No business number found in session");
      throw new Error("Cannot get the user session business_number");
    }

    const { data, error } = await postgrest
      .from("business_settings" as any)
      .select("ai_provider_key")
      .eq("business_number", businessNumber)
      .single();

    if (error) {
      console.log("❌ Database fetch error:", error);
      throw new Error(`Failed to load AI settings: ${error.message}`);
    }

    console.log("✅ AI settings loaded successfully");
    return data?.ai_provider_key || null;
  } catch (error) {
    console.log("❌ Final error in loadAISettings:", error);
    return null;
  }
}

export async function getBusinessSettings() {
  try {
    const session = await auth();
    if (!session?.user?.user_catalog_id) {
      throw new Error("No user session found");
    }
    const { data: user } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .select(
        "business_name,legal_business_name,business_number,business_registration_no,store_name,store_url,store_email,store_mobile,billing_first_name,billing_last_name,billing_company,billing_phone,billing_email,billing_address_1,billing_address_2,billing_country,billing_state,billing_city,billing_postcode,shipping_first_name,shipping_last_name,shipping_company,shipping_phone,shipping_email,shipping_address_1,shipping_address_2,shipping_country,shipping_state,shipping_city,shipping_postcode"
      )
      .eq("user_catalog_id", session.user.user_catalog_id)
      .limit(1)
      .single();

    if (!user) {
      throw new Error("User not found");
    }

    return {
      data: user,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : error,
    };
  }
}

export async function updateBusinessSettings(updatedSettings: Record<string, any>) {
  try {
    const session = await auth();
    if (!session?.user?.user_catalog_id) {
      throw new Error("No user session found");
    }
    const { error, data, status, count, statusText } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .update(updatedSettings)
      .eq("user_catalog_id", session.user.user_catalog_id);

    const { data: info } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .select("*")
      .eq("user_catalog_id", session.user.user_catalog_id);
    
    

    console.log({data, status, count, statusText});
      
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/businesssettings");
    return {};
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : error,
    };
  }
}

// AI SETTINGS

export interface AISettings {
  provider: string;
  model: string;
  tokens_used: string;
  start_date: string;
  end_date: string;
  status: "active" | "inactive";
  id: string;
  [key: string]: any;
}

export async function editAIFieldsSettings(
  editId: string,
  updatedFields: Partial<AISettings>
) {
  const session = await auth();
  if (!session?.user?.user_catalog_id) throw new Error("No user session found");
  try {
    const { data: userData, error: fetchError } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .select("aiapi_connection_json")
      .eq("user_catalog_id", session.user.user_catalog_id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    let existingArray: AISettings[] = [];
    if (
      userData?.aiapi_connection_json &&
      Array.isArray(userData.aiapi_connection_json)
    ) {
      existingArray = userData.aiapi_connection_json as AISettings[];
    }

    let updatedArray;
    if (updatedFields.default === true) {
      updatedArray = existingArray.map((item) => {
        if (item.id === editId) {
          return { ...item, ...updatedFields, default: true };
        } else {
          return { ...item, default: false };
        }
      });
    } else {
      updatedArray = existingArray.map((item) =>
        item.id === editId
          ? { ...item, ...updatedFields, default: false }
          : item
      );
    }

    const { data, error } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .update({
        aiapi_connection_json: updatedArray,
      })
      .eq("user_catalog_id", session.user.user_catalog_id);
    if (error) {
      throw error;
    }
    return { data, success: true };
  } catch (error) {
    throw error;
  }
}

export async function deleteAIFieldsSettings(deleteId: string) {
  const session = await auth();
  if (!session?.user?.user_catalog_id) throw new Error("No user session found");
  try {
    const { data: userData, error: fetchError } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .select("aiapi_connection_json")
      .eq("user_catalog_id", session.user.user_catalog_id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    let existingArray: AISettings[] = [];
    if (
      userData?.aiapi_connection_json &&
      Array.isArray(userData.aiapi_connection_json)
    ) {
      existingArray = userData.aiapi_connection_json as AISettings[];
    }

    const updatedArray = existingArray.filter((item) => item.id !== deleteId);

    const { data, error } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .update({
        aiapi_connection_json: updatedArray,
      })
      .eq("user_catalog_id", session.user.user_catalog_id);
    if (error) {
      throw error;
    }
    return { data, success: true };
  } catch (error) {
    throw error;
  }
}

export async function getAISettingsData() {
  const session = await auth();
  if (!session?.user?.user_catalog_id) return { error: "No user session found" };
  try {
    const { data, error } = await postgrest
      .from("user_catalog")
      .select("aiapi_connection_json,user_catalog_id")
      .eq("user_catalog_id", session.user.user_catalog_id)
      .single();

    if (error) {
      throw error;
    }

    return { data, success: true };
  } catch (error) {
    return { error };
  }
}

export async function saveAIFieldsSettings(payload: Partial<AISettings>, randomId: string) {
  const session = await auth();
  if (!session?.user?.user_catalog_id) throw new Error("No user session found");
  try {
    const { data: userData, error: fetchError } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .select("aiapi_connection_json")
      .eq("user_catalog_id", session.user.user_catalog_id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    let existingArray: AISettings[] = [];
    if (
      userData?.aiapi_connection_json &&
      Array.isArray(userData.aiapi_connection_json)
    ) {
      existingArray = userData.aiapi_connection_json as AISettings[];
    }

    let updatedArray;
    if (payload.default === true) {
      updatedArray = existingArray.map((item) => ({ ...item, default: false }));
      updatedArray.push({
        ...payload,
        id: randomId,
        default: true,
      });
    } else {
      updatedArray = [
        ...existingArray,
        {
          ...payload,
          id: randomId,
          default: false,
        },
      ];
    }

    const { data, error } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .update({
        aiapi_connection_json: updatedArray,
      })
      .eq("user_catalog_id", session.user.user_catalog_id);
    if (error) {
      throw error;
    }
    return { data, success: true };
  } catch (error) {
    throw error;
  }
}

export interface WooSettings {
  id: string;
  apiname: string;
  App_name: string;
  site_url: string;
  consumer_key: string;
  consumer_secret: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// Fetch WooCommerce settings for logged-in user
export async function getWooSettingsData() {
  const session = await auth();
  if (!session?.user?.user_catalog_id) return { error: "No user session found" };
  try {
    const { data, error } = await postgrest
      .from("user_catalog")
      .select("api_connection_json,user_catalog_id")
      .eq("user_catalog_id", session.user.user_catalog_id)
      .single();

    if (error) throw error;

    const rows = Array.isArray(data?.api_connection_json) ? data.api_connection_json : [];

    // Filter to WooSettings shape
    const wooOnly = rows.filter(
      (r) =>
        r &&
        typeof r === "object" &&
        "site_url" in r &&
        "consumer_key" in r &&
        "consumer_secret" in r
    ) as WooSettings[];

    return {
      data: {
        api_connection_json: wooOnly,
        user_catalog_id: data?.user_catalog_id as string,
      },
      success: true,
    };
  } catch (error) {
    return { error };
  }
}

// Save new WooSettings config with uniqueness enforcement on active per apiname
export async function saveWooFieldsSettings(payload: Partial<WooSettings>, randomId: string) {
  const session = await auth();
  if (!session?.user?.user_catalog_id) throw new Error("No user session found");
  try {
    const { data: userData, error: fetchError } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .select("api_connection_json")
      .eq("user_catalog_id", session.user.user_catalog_id)
      .single();

    if (fetchError) throw fetchError;

    let existingArray: WooSettings[] = Array.isArray(userData?.api_connection_json)
      ? (userData!.api_connection_json as WooSettings[])
      : [];

    const now = new Date().toISOString();

    // If saving as active, deactivate any prior active with same apiname
    if (payload.status === "active" && payload.apiname) {
      existingArray = existingArray.map((item) =>
        item.apiname === payload.apiname && item.status === "active"
          ? { ...item, status: "inactive", updated_at: now }
          : item
      );
    }

    const newRow: WooSettings = {
      id: randomId,
      apiname: payload.apiname ?? "WooCommerce",
      App_name: payload.App_name ?? "",
      site_url: payload.site_url ?? "",
      consumer_key: payload.consumer_key ?? "",
      consumer_secret: payload.consumer_secret ?? "",
      status: (payload.status as "active" | "inactive") ?? "inactive",
      created_at: payload.created_at ?? now,
      updated_at: now,
    };

    const updatedArray = [...existingArray, newRow];

    const { data, error } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .update({ api_connection_json: updatedArray })
      .eq("user_catalog_id", session.user.user_catalog_id);

    if (error) throw error;
    return { data, success: true };
  } catch (error) {
    throw error;
  }
}

// Edit existing WooSettings config with same uniqueness enforcement on active per apiname
export async function editWooFieldsSettings(editId: string, updatedFields: Partial<WooSettings>) {
  const session = await auth();
  if (!session?.user?.user_catalog_id) throw new Error("No user session found");
  try {
    const { data: userData, error: fetchError } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .select("api_connection_json")
      .eq("user_catalog_id", session.user.user_catalog_id)
      .single();

    if (fetchError) throw fetchError;

    let existingArray: WooSettings[] = Array.isArray(userData?.api_connection_json)
      ? (userData!.api_connection_json as WooSettings[])
      : [];

    const now = new Date().toISOString();

    // If setting this config active, deactivate others with same apiname
    if (updatedFields.status === "active" && updatedFields.apiname) {
      existingArray = existingArray.map((item) =>
        item.id !== editId && item.apiname === updatedFields.apiname && item.status === "active"
          ? { ...item, status: "inactive", updated_at: now }
          : item
      );
    }

    const updatedArray = existingArray.map((item) =>
      item.id === editId
        ? { ...item, ...updatedFields, updated_at: now }
        : item
    );

    const { data, error } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .update({ api_connection_json: updatedArray })
      .eq("user_catalog_id", session.user.user_catalog_id);

    if (error) throw error;
    return { data, success: true };
  } catch (error) {
    throw error;
  }
}

// Delete WooSettings config by id
export async function deleteWooFieldsSettings(deleteId: string) {
  const session = await auth();
  if (!session?.user?.user_catalog_id) throw new Error("No user session found");
  try {
    const { data: userData, error: fetchError } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .select("api_connection_json")
      .eq("user_catalog_id", session.user.user_catalog_id)
      .single();

    if (fetchError) throw fetchError;

    let existingArray: WooSettings[] = Array.isArray(userData?.api_connection_json)
      ? (userData!.api_connection_json as WooSettings[])
      : [];

    const updatedArray = existingArray.filter((item) => item.id !== deleteId);

    const { data, error } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .update({ api_connection_json: updatedArray })
      .eq("user_catalog_id", session.user.user_catalog_id);

    if (error) throw error;
    return { data, success: true };
  } catch (error) {
    throw error;
  }
}