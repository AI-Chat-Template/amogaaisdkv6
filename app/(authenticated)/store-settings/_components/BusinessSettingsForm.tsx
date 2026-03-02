import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getBusinessSettings, updateBusinessSettings } from "../actions"; // Import the type
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const BusinessSettingsForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    business_name: "",
    legal_business_name: "",
    business_number: "",
    business_registration_no: "",
    store_name: "",
    store_url: "",
    store_email: "",
    store_mobile: "",
  });

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      const { data, error } = await getBusinessSettings();
      if (error) {
        toast.error("Failed to load business settings.");
        console.error("Error fetching business settings:", error);
        return;
      }
      setSettings(data || {});
      setIsLoading(false);
    }
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateBusinessSettings(settings);
    if (error) {
      toast.error("Failed to update business settings.");
      console.error("Error updating business settings:", error);
      return;
    }
    toast.success("Settings updated successfully!");
    setIsSaving(false);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-medium">Business Settings</h3>

      <div className="space-y-2">
        <Label htmlFor="business_name">Business Name</Label>
        <Input
          id="business_name"
          name="business_name"
          value={settings.business_name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="legal_business_name">Legal Business Name</Label>
        <Input
          id="legal_business_name"
          name="legal_business_name"
          value={settings.legal_business_name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="business_number">Business Number</Label>
        <Input
          id="business_number"
          name="business_number"
          value={settings.business_number}
          //   onChange={handleChange}
          //   required
          readOnly
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="registration_no">Registration No</Label>
        <Input
          id="registration_no"
          name="business_registration_no"
          value={settings.business_registration_no}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store_name">Store Name</Label>
        <Input
          id="store_name"
          name="store_name"
          value={settings.store_name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store_url">Store URL</Label>
        <Input
          id="store_url"
          name="store_url"
          value={settings.store_url}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store_email">Store Email</Label>
        <Input
          id="store_email"
          name="store_email"
          value={settings.store_email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store_mobile">Store Mobile</Label>
        <Input
          id="store_mobile"
          name="store_mobile"
          value={settings.store_mobile}
          onChange={handleChange}
          required
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full sm:w-auto"
      >
        {isSaving || isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Save Settings
      </Button>
    </div>
  );
};
