"use server";

import { auth } from "@/auth";
import { n8n } from "@/lib/n8n";
import { postgrest } from "@/lib/postgrest";
import { revalidatePath } from "next/cache";

// Renamed: Represents configuration for a SINGLE platform
export interface DataSourceConfig {
  platform_type: "shopify" | "woocommerce"; // Made non-null for an existing config
  status: "active" | "inactive" | "error" | "pending";
  autoConfigured?: boolean;
  error_message?: string;
  last_data_sync_date?: string; // ISO 8601 format
  n8n_credential_id?: string;
  n8n_workflow_id?: string;
  credentials: {
    // Credentials specific to this platform
    shopify?: NonNullable<DataSourceConfigBase["credentials"]["shopify"]>;
    woocommerce?: NonNullable<
      DataSourceConfigBase["credentials"]["woocommerce"]
    >;
  };
  last_tested_date?: string;
  created_at?: string;
  updated_at?: string;
  remarks?: string; // Added remarks here
}

// Base type definition used internally
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

// Type for testing/saving a single platform's settings
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
export async function getConnectionSettings(business_number?: string): Promise<{
  data?: DataSourceConfig[] | null;
  error?: string;
} | null> {
  try {
    const sessions = await auth();
    const businessNumber = sessions?.user?.business_number || business_number;

    if (!businessNumber) {
      throw new Error("Cannot get the user session business_number");
    }
    const { data, error } = await postgrest
      .from("business_settings")
      .select("data_source_json")
      .eq("business_number", businessNumber)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Postgrest error fetching settings:", error);
      throw new Error(error.message);
    }

    // Ensure data_source_json is treated as DataSourceConfig[] or null
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
    } else {
      return await n8n.testWooCommerceConnection(
        payload.settings.site_url,
        payload.settings.consumer_key,
        payload.settings.consumer_secret
      );
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
    const { data: existingConfigsArray, error: fetchError } =
      await getConnectionSettings(businessNumber);
    if (fetchError) {
      console.log("❌ Failed to fetch existing settings:", fetchError);
      throw new Error(`Failed to fetch existing settings: ${fetchError}`);
    }

    const currentConfigs: DataSourceConfig[] = existingConfigsArray || [];
    const existingConfig = currentConfigs.find(
      (c) => c.platform_type === payload.platform
    );

    try {
      // Update database
      console.log("💾 Preparing database update...");
      const newConfigData: DataSourceConfig = {
        platform_type: payload.platform,
        status: "pending",
        autoConfigured: payload?.autoConfigured || false,
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
        .from("business_settings")
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
    } catch (n8nError) {
      console.log("❌ N8N integration error:", n8nError);
      throw new Error(
        `Failed to setup n8n integration: ${
          n8nError instanceof Error ? n8nError.message : "Unknown error"
        }`
      );
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
    const { error } = await postgrest
      .from("business_settings")
      .upsert(
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
export async function loadAISettings(business_number?: string): Promise<{ provider: string; apiKey: string } | null> {
  console.log("🔍 Loading AI settings...");

  try {
    const sessions = await auth();
    const businessNumber = sessions?.user?.business_number || business_number;

    if (!businessNumber) {
      console.log("❌ Auth Error: No business number found in session");
      throw new Error("Cannot get the user session business_number");
    }

    const { data, error } = await postgrest
      .from("business_settings")
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
    const { data: user } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .select(
        "business_name,legal_business_name,business_number,business_registration_no,store_name,store_url,store_email,store_mobile"
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
      error,
    };
  }
}

export async function updateBusinessSettings(updatedSettings) {
  try {
    const session = await auth();
    const { error } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .update(updatedSettings)
      .eq("user_catalog_id", session.user.user_catalog_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/businesssettings");
    return {};
  } catch (error) {
    return {
      error,
    };
  }
}
