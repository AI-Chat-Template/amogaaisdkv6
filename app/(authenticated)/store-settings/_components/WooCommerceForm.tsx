import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2} from "lucide-react";
import { DataSourceConfig } from '../actions'; // Import the type
import { Textarea } from '@/components/ui/textarea';

interface WooCommerceFormProps {
  config: DataSourceConfig | undefined; // Pass the specific config for this platform, or undefined if none exists
  onSettingsChange: (newSettings: NonNullable<DataSourceConfig['credentials']['woocommerce']>) => void;
  onRemarksChange: (remarks: string) => void;
  onTestConnection: () => void;
  onSave: () => void;
  isTesting: boolean;
  isSaving: boolean;
  isDisabled: boolean; // General disable state
}

export const WooCommerceForm: React.FC<WooCommerceFormProps> = ({
  config,
  onSettingsChange,
  onRemarksChange,
  onTestConnection,
  onSave,
  isTesting,
  isSaving,
  isDisabled,
}) => {
  const settings = config?.credentials?.woocommerce || { site_url: '', consumer_key: '', consumer_secret: '' };
  const remarks = config?.remarks || '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, [e.target.name]: e.target.value });
  };

   const handleRemarksChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onRemarksChange(e.target.value);
  };

  const canTest = !!settings.site_url && !!settings.consumer_key && !!settings.consumer_secret;
  const canSave = canTest; // Same conditions for saving

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-medium">WooCommerce Connection</h3>
       <div className="space-y-2">
        <Label htmlFor="site_url">Site URL *</Label>
        <Input
          id="site_url"
          name="site_url"
          placeholder="https://your-store.com"
          value={settings?.site_url || ''}
          onChange={handleChange}
          disabled={isDisabled || isSaving}
          required
        />
        <p className="text-xs text-muted-foreground">Your WordPress site URL where WooCommerce is installed.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="consumer_key">Consumer Key *</Label>
        <Input
          id="consumer_key"
          name="consumer_key"
          type="password"
          placeholder="Enter your WooCommerce Consumer Key"
          value={settings?.consumer_key || ''}
          onChange={handleChange}
          disabled={isDisabled || isSaving}
          required
        />
        <p className="text-xs text-muted-foreground">Your WooCommerce REST API Consumer Key (starts with &apos;ck_&apos;).</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="consumer_secret">Consumer Secret *</Label>
        <Input
          id="consumer_secret"
          name="consumer_secret"
          type="password"
          placeholder="Enter your WooCommerce Consumer Secret"
          value={settings?.consumer_secret || ''}
          onChange={handleChange}
          disabled={isDisabled || isSaving}
          required
        />
        <p className="text-xs text-muted-foreground">Your WooCommerce REST API Consumer Secret (starts with &apos;cs_&apos;).</p>
      </div>

       {/* Remarks Section */}
       <div className="space-y-2">
          <div className="flex items-center justify-between">
          <Label htmlFor="woo-remarks">Remarks</Label>
          <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          <Textarea
              id="woo-remarks"
              placeholder="Add any notes or comments about this connection"
              value={remarks}
              onChange={handleRemarksChange}
              rows={3}
              disabled={isDisabled || isSaving}
          />
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-end">
         <Button
            variant="outline"
            onClick={onTestConnection}
            disabled={isTesting || isDisabled || isSaving || !canTest}
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
         <Button
            onClick={onSave}
            disabled={isSaving || isDisabled || isTesting || !canSave}
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
