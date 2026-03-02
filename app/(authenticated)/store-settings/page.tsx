"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Remove Label and Textarea imports if they are only used inside child components now
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Remove Alert imports if only used inside child components
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  getConnectionSettings,
  saveConnectionSettings,
  testConnection,
  DataSourceConfig,
  PlatformSettingsPayload,
  saveAISettings,
  loadAISettings,
} from "./actions";
import { ShopifyForm } from "./_components/ShopifyForm";
import { WooCommerceForm } from "./_components/WooCommerceForm";
import { BusinessSettingsForm } from "./_components/BusinessSettingsForm";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Platform = "woocommerce" | "shopify";

export default function ApiSettingsPage() {
  const [activeTab, setActiveTab] = useState<Platform | "business-settings">(
    "business-settings"
  );
  const [configs, setConfigs] = useState<DataSourceConfig[] | null>(null); // State holds the array
  const [initialLoading, setInitialLoading] = useState(true);
  // Local state for remarks being edited, specific to the active tab
  const [currentRemarks, setCurrentRemarks] = useState("");

  // Separate transitions for each action type
  const [isTesting, startTestTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  // AI Settings Handlers
  const [aiProvider, setAIProvider] = useState<string>("");
  const [aiApiKey, setAIApiKey] = useState<string>("");

  // Derived state for the currently active configuration
  const activeConfig = configs?.find((c) => c.platform_type === activeTab);

  // Fetch initial data
  useEffect(() => {
    getConnectionSettings().then((result) => {
      if (result?.data) {
        setConfigs(result.data);
        // Set initial active tab based on fetched data if needed, or default
        const firstConfig = result.data[0];
        if (firstConfig) {
          // setActiveTab(firstConfig.platform_type); // Optionally set tab to first configured platform
        }
      } else if (result?.error) {
        toast.error("Failed to load settings", { description: result.error });
      }
      setInitialLoading(false);
    });
  }, []);

  // Load AI settings on component mount
  useEffect(() => {
    async function fetchAISettings() {
      try {
        const aiSettings = await loadAISettings();
        console.log("Loaded AI settings:", aiSettings);
        if (aiSettings) {
          setAIProvider(aiSettings.provider);
          setAIApiKey(aiSettings.apiKey);
        }
      } catch (error) {
        toast.error("Failed to load AI settings", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    fetchAISettings();
  }, []);

  // Update remarks state when tab changes
  useEffect(() => {
    setCurrentRemarks(activeConfig?.remarks || "");
  }, [activeTab, activeConfig]);

  // Generic handler to update credentials in state for the active tab
  const handleSettingsChange = useCallback(
    (platform: Platform, newPlatformSettings: unknown) => {
      setConfigs((prevConfigs) => {
        const updatedConfigs = [...(prevConfigs || [])];
        const index = updatedConfigs.findIndex(
          (c) => c.platform_type === platform
        );
        const currentConfig = updatedConfigs[index];

        const newCredentials = { [platform]: newPlatformSettings };

        if (index > -1) {
          // Update existing config's credentials
          updatedConfigs[index] = {
            ...currentConfig,
            credentials: newCredentials,
          };
        } else {
          // Add a new config object if it doesn't exist (for initial input)
          updatedConfigs.push({
            platform_type: platform,
            status: "pending", // Initial status
            credentials: newCredentials,
            // Initialize other fields as needed
          } as DataSourceConfig); // Type assertion might be needed
        }
        return updatedConfigs;
      });
    },
    []
  );

  // Handler to update remarks in state for the active tab
  const handleRemarksChange = useCallback(
    (remarks: string) => {
      setCurrentRemarks(remarks);
      // We can also update the main state here directly if preferred,
      // but saving will handle persisting it.
      setConfigs((prevConfigs) => {
        const updatedConfigs = [...(prevConfigs || [])];
        const index = updatedConfigs.findIndex(
          (c) => c.platform_type === activeTab
        );
        if (index > -1) {
          updatedConfigs[index] = {
            ...updatedConfigs[index],
            remarks: remarks,
          };
          return updatedConfigs;
        }
        // If config doesn't exist yet, remarks will be saved with it on first save
        return prevConfigs;
      });
    },
    [activeTab]
  );

  // --- Action Handlers (Specific to Active Tab) ---

  const handleTestConnection = () => {
    if (!activeConfig?.credentials?.[activeTab]) {
      toast.error("Missing configuration", {
        description: `Please fill in all required fields for ${activeTab}.`,
      });
      return;
    }

    const payload: PlatformSettingsPayload = {
      platform: activeTab,
      settings: activeConfig.credentials[activeTab], // Type assertion
    };

    startTestTransition(async () => {
      toast.info(`Testing ${activeTab} connection...`);
      const result = await testConnection(payload);
      if (result.success) {
        toast.success("Connection Test Successful", {
          description: result.message,
        });
        // Optionally update last_tested_date in local state or trigger a refresh
      } else {
        toast.error("Connection Test Failed", { description: result.message });
      }
    });
  };

  const handleSave = () => {
    if (!activeConfig?.credentials?.[activeTab]) {
      toast.error("Missing configuration", {
        description: `Please fill in all required fields for ${activeTab} before saving.`,
      });
      return;
    }

    const payload: PlatformSettingsPayload = {
      platform: activeTab,
      settings: activeConfig.credentials[activeTab],
    };

    startSaveTransition(async () => {
      toast.info(`Saving ${activeTab} settings...`);
      // Pass the current remarks for the active tab
      const result = await saveConnectionSettings(payload, currentRemarks);
      if (result.success && result.data) {
        toast.success("Settings Saved", { description: result.message });
        setConfigs(result.data); // Update local state with the full array returned from server
      } else {
        toast.error("Failed to Save Settings", { description: result.message });
      }
    });
  };

  const handleAISave = () => {
    if (!aiProvider || !aiApiKey) {
      toast.error("Missing AI configuration", {
        description: "Please select a provider and enter an API key.",
      });
      return;
    }

    startSaveTransition(async () => {
      toast.info("Saving AI settings...");
      const result = await saveAISettings(aiProvider, aiApiKey);

      if (result.success) {
        toast.success("AI settings saved successfully.");
      } else {
        toast.error("Failed to save AI settings", {
          description: result.message,
        });
      }
    });
  };

  // --- End Action Handlers ---

  if (initialLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Determine if any action is in progress for the current tab
  const isActionInProgress = isTesting || isSaving;

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">API Connection Settings</CardTitle>
          <CardDescription>
            Configure and manage connections to sync data with WooCommerce or
            Shopify.
          </CardDescription>
          {/* Removed global status/sync date display - now shown per tab */}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              {/* Platform Selection Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as Platform)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="business-settings">Store</TabsTrigger>
                  <TabsTrigger
                    value="woocommerce"
                    disabled={isActionInProgress}
                  >
                    WooCommerce
                  </TabsTrigger>
                  {/* <TabsTrigger value="shopify" disabled={isActionInProgress}>
                    Shopify
                  </TabsTrigger> */}
                  <TabsTrigger value="ai" disabled={isActionInProgress}>
                    AI APIs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="business-settings" className="mt-4">
                  <BusinessSettingsForm />
                </TabsContent>

                {/* WooCommerce Tab Content */}
                <TabsContent value="woocommerce" className="mt-4">
                  <WooCommerceForm
                    config={configs?.find(
                      (c) => c.platform_type === "woocommerce"
                    )}
                    onSettingsChange={(newSettings) =>
                      handleSettingsChange("woocommerce", newSettings)
                    }
                    onRemarksChange={handleRemarksChange}
                    onTestConnection={handleTestConnection}
                    onSave={handleSave}
                    isTesting={isTesting}
                    isSaving={isSaving}
                    isDisabled={
                      activeTab !== "woocommerce" && isActionInProgress
                    } // Disable if actions happening on other tab
                  />
                </TabsContent>

                {/* Shopify Tab Content */}
                <TabsContent value="shopify" className="mt-4">
                  <ShopifyForm
                    config={configs?.find((c) => c.platform_type === "shopify")}
                    onSettingsChange={(newSettings) =>
                      handleSettingsChange("shopify", newSettings)
                    }
                    onRemarksChange={handleRemarksChange}
                    onTestConnection={handleTestConnection}
                    onSave={handleSave}
                    isTesting={isTesting}
                    isSaving={isSaving}
                    isDisabled={activeTab !== "shopify" && isActionInProgress} // Disable if actions happening on other tab
                  />
                </TabsContent>

                {/* AI APIs Tab Content */}
                <TabsContent value="ai" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select
                      onValueChange={(value) => setAIProvider(value)}
                      value={aiProvider}
                      id="provider"
                    >
                      <SelectTrigger id="provider" className="">
                        <SelectValue placeholder="Select Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="gemini">Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label htmlFor="shop_subdomain">API Key</Label>
                    <Input
                      id="apiKey"
                      name="apiKey"
                      placeholder="api key"
                      onChange={(e) => setAIApiKey(e.target.value)}
                      value={aiApiKey}
                      required
                    />
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-end">
                    <Button type="button" onClick={handleAISave}>
                      Save AI Settings
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            {/* Removed global remarks section */}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between items-center">
          {/* Keep general info footer */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Configure connections individually. Credentials are stored
              securely after saving.
            </p>
          </div>
          {/* Removed global action buttons */}
        </CardFooter>
      </Card>
    </div>
  );
}
