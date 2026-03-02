import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { DataSourceConfig } from '../actions'; // Import the type
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from '@/components/ui/textarea';

interface ShopifyFormProps {
  config: DataSourceConfig | undefined; // Pass the specific config for this platform, or undefined if none exists
  onSettingsChange: (newSettings: NonNullable<DataSourceConfig['credentials']['shopify']>) => void;
  onRemarksChange: (remarks: string) => void;
  onTestConnection: () => void;
  onSave: () => void;
  onSyncData: () => void;
  isTesting: boolean;
  isSaving: boolean;
  isSyncing: boolean;
  isDisabled: boolean; // General disable state (e.g., while another platform is saving)
}

export const ShopifyForm: React.FC<ShopifyFormProps> = ({
  config,
  onSettingsChange,
  onRemarksChange,
  onTestConnection,
  onSave,
  onSyncData,
  isTesting,
  isSaving,
  isSyncing,
  isDisabled,
}) => {
  const settings = config?.credentials?.shopify || { shop_subdomain: '', access_token: '', app_secret_key: '' };
  const remarks = config?.remarks || '';
  const isConfigured = !!config?.n8n_credential_id; // Check if saved at least once

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, [e.target.name]: e.target.value });
  };

  const handleRemarksChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onRemarksChange(e.target.value);
  };

  const canTest = !!settings.shop_subdomain && !!settings.access_token && !!settings.app_secret_key;
  const canSave = canTest; // Same conditions for saving
  const canSync = isConfigured && config?.status !== 'error' && !!config?.n8n_workflow_id;

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-medium">Shopify Connection</h3>

       {config?.status && (
         <Alert variant={config.status === 'active' ? 'default' : config.status === 'error' ? 'destructive' : 'default'} className="mt-4">
           {config.status === 'active' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
           <AlertTitle>
             Status: <span className="capitalize">{config.status}</span>
             {config.last_tested_date && ` (Last Tested: ${new Date(config.last_tested_date).toLocaleString()})`}
           </AlertTitle>
           {config.error_message && <AlertDescription>{config.error_message}</AlertDescription>}
         </Alert>
       )}
       {config?.last_data_sync_date && (
            <p className="text-sm text-muted-foreground mt-2">Last data sync: {new Date(config.last_data_sync_date).toLocaleString()}</p>
       )}

      <div className="space-y-2">
        <Label htmlFor="shop_subdomain">Shop Subdomain *</Label>
        <Input
          id="shop_subdomain"
          name="shop_subdomain"
          placeholder="your-store"
          value={settings?.shop_subdomain || ''}
          onChange={handleChange}
          disabled={isDisabled || isSaving || isSyncing}
          required
        />
        <p className="text-xs text-muted-foreground">Enter your shop subdomain (e.g., &apos;your-store&apos; from your-store.myshopify.com)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="access_token">Access Token *</Label>
        <Input
          id="access_token"
          name="access_token"
          type="password"
          placeholder="Enter your Shopify Admin API access token"
          value={settings?.access_token || ''}
          onChange={handleChange}
          disabled={isDisabled || isSaving || isSyncing}
          required
        />
        <p className="text-xs text-muted-foreground">Your Shopify Admin API access token (starts with &apos;shpat_&apos;)</p>
      </div>

       <div className="space-y-2">
        <Label htmlFor="app_secret_key">APP Secret Key *</Label>
        <Input
          id="app_secret_key"
          name="app_secret_key"
          type="password"
          placeholder="Enter your Shopify App Secret Key"
          value={settings?.app_secret_key || ''}
          onChange={handleChange}
          disabled={isDisabled || isSaving || isSyncing}
          required
        />
        <p className="text-xs text-muted-foreground">Your Shopify custom app&apos;s secret key.</p>
      </div>

       {/* Remarks Section */}
       <div className="space-y-2">
          <div className="flex items-center justify-between">
          <Label htmlFor="shopify-remarks">Remarks</Label>
          <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          <Textarea
              id="shopify-remarks"
              placeholder="Add any notes or comments about this connection"
              value={remarks}
              onChange={handleRemarksChange}
              rows={3}
              disabled={isDisabled || isSaving || isSyncing}
          />
      </div>


      {/* Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-end">
         <Button
            variant="outline"
            onClick={onTestConnection}
            disabled={isTesting || isDisabled || isSaving || isSyncing || !canTest}
            className="w-full sm:w-auto"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>Test Connection</>
            )}
          </Button>
          {canSync && (
             <Button
                variant="secondary"
                onClick={onSyncData}
                disabled={isSyncing || isDisabled || isSaving || isTesting}
                className="w-full sm:w-auto"
             >
                {isSyncing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                    </>
                ) : (
                    <><RefreshCw className="mr-2 h-4 w-4" /> Sync Data Now</>
                )}
             </Button>
         )}
         <Button
            onClick={onSave}
            disabled={isSaving || isDisabled || isTesting || isSyncing || !canSave}
            className="w-full sm:w-auto"
         >
            {isSaving ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
            </>
            ) : (
            <>Save Settings</>
            )}
        </Button>
      </div>
    </div>
  );
};
