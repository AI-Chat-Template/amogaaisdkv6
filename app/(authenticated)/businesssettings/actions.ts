"use server";

import { auth } from "@/auth";
import { n8n } from "@/lib/n8n";
import { postgrest } from "@/lib/postgrest";
import { revalidatePath } from "next/cache";
import {
  getShopifySyncWorkflowTemplate,
  getShopifyWorkflowTemplate,
  getWooCommerceSyncWorkflowTemplate,
  getWooCommerceWorkflowTemplate,
} from "./_lib/flows_template";

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

  let newCredential;

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
    console.log("ℹ️ Existing config found:", existingConfig ? "Yes" : "No");

    // 2. Handle n8n credential and workflow updates
    console.log("🔄 Starting n8n integration process...");

    try {
      // Cleanup existing n8n resources
      if (existingConfig?.n8n_credential_id) {
        console.log("🗑️ Cleaning up existing n8n resources...");
        if (existingConfig.n8n_workflow_id) {
          console.log(
            `- Deactivating workflow: ${existingConfig.n8n_workflow_id}`
          );
          await n8n.setWorkflowActive(existingConfig.n8n_workflow_id, false);
        }
        console.log(
          `- Deleting credential: ${existingConfig.n8n_credential_id}`
        );
        await n8n.deleteCredential(existingConfig.n8n_credential_id);
      }

      // Create new credentials
      const credentialName = `#BNUM ${businessNumber} - ${payload.platform.toUpperCase()} Credentials`;
      console.log("🔑 Creating new n8n credential:", credentialName);

      // Setup credential data
      let credentialType: string;
      let credentialData: Record<string, unknown>;

      if (payload.platform === "shopify") {
        credentialType = "shopifyAccessTokenApi";
        credentialData = {
          shopSubdomain: payload.settings.shop_subdomain,
          accessToken: payload.settings.access_token,
          appSecretKey: payload.settings.app_secret_key,
        };
      } else {
        credentialType = "wooCommerceApi";
        credentialData = {
          url: payload.settings.site_url,
          consumerKey: payload.settings.consumer_key,
          consumerSecret: payload.settings.consumer_secret,
          includeCredentialsInQuery: true,
        };
      }

      console.log("📦 Creating n8n credential with type:", credentialType);
      console.log(" credentialData", credentialData);
      newCredential = await n8n.createCredential(
        credentialName,
        credentialType,
        credentialData
      );
      console.log("✅ New credential created:", newCredential.id);

      // Workflow handling
      const workflowName = `#BNUM ${businessNumber} - ${payload.platform.toUpperCase()} Integration`;
      console.log("🔍 Checking for existing workflow:", workflowName);
      let workflow = await n8n.getWorkflow(workflowName);

      console.log("📋 Preparing workflow template...");
      const workflowTemplate =
        payload.platform === "shopify"
          ? getShopifyWorkflowTemplate(
              workflowName,
              businessNumber,
              String(newCredential.id),
              credentialName
            )
          : getWooCommerceWorkflowTemplate(
              workflowName,
              businessNumber,
              String(newCredential.id),
              credentialName
            );

      if (workflow) {
        console.log("📝 Updating existing workflow:", workflow.id);
        workflow = await n8n.updateWorkflow(workflow.id, {
          name: workflowName,
          ...workflowTemplate,
        });
      } else {
        console.log("🆕 Creating new workflow...");
        workflow = await n8n.createWorkflow({
          name: workflowName,
          ...workflowTemplate,
        });
      }

      console.log("▶️ Activating workflow:", workflow.id);
      await n8n.setWorkflowActive(workflow.id, true);
      console.log("✅ N8N integration completed successfully");

      // Update database
      console.log("💾 Preparing database update...");
      const newConfigData: DataSourceConfig = {
        platform_type: payload.platform,
        status: "pending",
        autoConfigured: payload?.autoConfigured || false,
        credentials: {
          [payload.platform]: payload.settings,
        },
        n8n_credential_id: newCredential.id,
        n8n_workflow_id: String(workflow.id),
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
    if (newCredential && newCredential?.id) {
      try {
        await n8n.deleteCredential(newCredential?.id);
      } catch {}
    }
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

// Sync data for a specific platform
export async function syncData(
  platform: "shopify" | "woocommerce",
  business_number?: string
): Promise<{ success: boolean; message: string }> {
  console.log("🟦 Starting syncData for platform:", platform);
  try {
    const sessions = await auth();
    const businessNumber = sessions?.user?.business_number || business_number;
    if (!businessNumber) {
      console.log("❌ Auth Error: No business number found");
      throw new Error("Cannot get the user session business_number");
    }

    const { data: settingsArray, error: fetchError } =
      await getConnectionSettings(businessNumber);
    if (fetchError || !settingsArray) {
      console.log(
        "❌ Could not retrieve settings to initiate sync:",
        fetchError
      );
      throw new Error(
        `Could not retrieve settings to initiate sync. Error: ${fetchError}`
      );
    }

    const config = settingsArray.find((c) => c.platform_type === platform);

    if (!config || !config.n8n_workflow_id) {
      console.log(
        `❌ Configuration or n8n workflow ID for ${platform} not found or not saved yet.`
      );
      throw new Error(
        `Configuration or n8n workflow ID for ${platform} not found or not saved yet.`
      );
    }

    console.log(
      `Initiating data sync for ${platform} using workflow ${config.n8n_workflow_id}`
    );

    let isSuccess;

    if (platform === "woocommerce") {
      console.log("🔄 Fetching WooCommerce sync workflow template...");
      const workflowTemplate = getWooCommerceSyncWorkflowTemplate(
        businessNumber,
        config.n8n_credential_id,
        `${businessNumber} credential name`
      );
      console.log("▶️ Executing WooCommerce sync workflow...");
      isSuccess = await n8n.runWorkflowFromTemplate(workflowTemplate);
    } else {
      console.log("🔄 Fetching Shopify sync workflow template...");
      const workflowTemplate = getShopifySyncWorkflowTemplate(
        businessNumber,
        config.n8n_credential_id,
        `${businessNumber} credential name`
      );
      console.log("▶️ Executing Shopify sync workflow...");
      isSuccess = await n8n.runWorkflowFromTemplate(workflowTemplate);
    }

    if (isSuccess) {
      const now = new Date().toISOString();
      // Update the specific config in the array
      const updatedConfigs = settingsArray.map(
        (c) =>
          c.platform_type === platform
            ? { ...c, last_data_sync_date: now, status: "active" }
            : c // Also set status to active on successful sync?
      );
      await postgrest
        .from("business_settings")
        .update({ data_source_json: updatedConfigs })
        .eq("business_number", businessNumber);

      revalidatePath("/businesssettings");
      console.log("✅ Sync completed successfully");
      return {
        success: true,
        message: `${platform} data synchronization started successfully.`,
      };
    } else {
      // Optionally update status to 'error' in DB here
      throw new Error(
        `Failed to trigger ${platform} data synchronization workflow.`
      );
    }
  } catch (error) {
    console.log(`❌ Sync error:`, error);
    // Optionally update status to 'error' in DB here
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : `An unknown error occurred during ${platform} data sync.`,
    };
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
