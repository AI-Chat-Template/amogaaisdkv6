import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import { getBusinessSettings, updateBusinessSettings } from "../actions";
import { useTranslations } from "next-intl";

type Settings = {
  business_name: string;
  legal_business_name: string;
  business_number: string;
  business_registration_no: string;
  store_name: string;
  store_url: string;
  store_email: string;
  store_mobile: string;
  billing_first_name:string,
  billing_last_name:string,
  billing_company: string,
  billing_phone: string,
  billing_email: string,
  billing_address_1: string,
  billing_address_2: string,
  billing_country: string,
  billing_state: string,
  billing_city: string,
  billing_postcode: string,
  shipping_first_name: string,
  shipping_last_name: string,
  shipping_company: string,
  shipping_phone: string,
  shipping_email: string,
  shipping_address_1: string,
  shipping_address_2: string,
  shipping_country: string,
  shipping_state: string,
  shipping_city: string,
  shipping_postcode: string
};

export const BusinessSettingsForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    business_name: "",
    legal_business_name: "",
    business_number: "",
    business_registration_no: "",
    store_name: "",
    store_url: "",
    store_email: "",
    store_mobile: "",
    billing_first_name:"",
    billing_last_name:"",
    billing_company: "",
    billing_phone: "",
    billing_email: "",
    billing_address_1: "",
    billing_address_2: "",
    billing_country: "",
    billing_state: "",
    billing_city: "",
    billing_postcode: "",
    shipping_first_name: "",
    shipping_last_name: "",
    shipping_company: "",
    shipping_phone: "",
    shipping_email: "",
    shipping_address_1: "",
    shipping_address_2: "",
    shipping_country: "",
    shipping_state: "",
    shipping_city: "",
    shipping_postcode: "",
  });
  const [snapshot, setSnapshot] = useState<Settings | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const { data, error } = await getBusinessSettings();
      if (error) {
        toast.error("Failed to load business settings.");
        setIsLoading(false);
        return;
      }
      setSettings((data as Settings) ?? settings);
      setIsLoading(false);
    })();
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editMode) return;
    const { name, value } = e.target;
    setSettings((s) => ({ ...s, [name]: value }));
  };

  const startEdit = () => {
    setSnapshot(settings);
    setEditMode(true);
  };

  const cancelEdit = () => {
    if (snapshot) setSettings(snapshot);
    setEditMode(false);
  };

  const save = async () => {
    setIsSaving(true);
    const { error } = await updateBusinessSettings(settings);
    if (error) {
      toast.error("Failed to update business settings.");
      setIsSaving(false);
      return;
    }
    toast.success("Settings updated successfully!");
    setIsSaving(false);
    setEditMode(false);
    setSnapshot(null);
  };

  const disabled = !editMode || isSaving || isLoading;
  const t = useTranslations("Settings");
  return (
    <div className="border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t("businessSettings")}</h3>
        {!editMode ? (
          <Button size="icon" variant="ghost" onClick={startEdit} aria-label="Edit">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={save} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
            <Button variant="outline" onClick={cancelEdit} disabled={isSaving} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="business_name">{t("businessName")}</Label>
        <Input id="business_name" name="business_name" value={settings.business_name ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="legal_business_name">{t("legalBusinessName")}</Label>
        <Input id="legal_business_name" name="legal_business_name" value={settings.legal_business_name ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="business_number">{t("businessNumber")}</Label>
        <Input id="business_number" name="business_number" value={settings.business_number ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="registration_no">{t("registrationNo")}</Label>
        <Input id="registration_no" name="business_registration_no" value={settings.business_registration_no ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store_name">{t("storeName")}</Label>
        <Input id="store_name" name="store_name" value={settings.store_name ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store_url">{t("storeUrl")}</Label>
        <Input id="store_url" name="store_url" value={settings.store_url ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store_email">{t("storeEmail")}</Label>
        <Input id="store_email" name="store_email" value={settings.store_email ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store_mobile">{t("storeMobile")}</Label>
        <Input id="store_mobile" name="store_mobile" value={settings.store_mobile ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billing_first_name">{t("billingFirstName")}</Label>
        <Input id="billing_first_name" name="billing_first_name" value={settings.billing_first_name ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billing_last_name">{t("billingLastName")}</Label>
        <Input id="billing_last_name" name="billing_last_name" value={settings.billing_last_name ?? ""} onChange={onChange} disabled={disabled} required />
      </div>
       
      <div className="space-y-2">
        <Label htmlFor="billing_company">{t("billingCompany")}</Label>
        <Input id="billing_company" name="billing_company" value={settings.billing_company ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billing_phone">{t("billingPhone")}</Label>
        <Input id="billing_phone" name="billing_phone" value={settings.billing_phone ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billing_email">{t("billingEmail")}</Label>
        <Input id="billing_email" name="billing_email" value={settings.billing_email ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billing_address_1">{t("billingAddress1")}</Label>
        <Input id="billing_address_1" name="billing_address_1" value={settings.billing_address_1 ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

       <div className="space-y-2">
        <Label htmlFor="billing_address_2">{t("billingAddress2")}</Label>
        <Input id="billing_address_2" name="billing_address_2" value={settings.billing_address_2 ?? ""} onChange={onChange} disabled={disabled} required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="billing_country">{t("billingCountry")}</Label>
        <Input id="billing_country" name="billing_country" value={settings.billing_country ?? ""} onChange={onChange} disabled={disabled} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="billing_state">{t("billingState")}</Label>
        <Input id="billing_state" name="billing_state" value={settings.billing_state ?? ""} onChange={onChange} disabled={disabled} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="billing_city">{t("billingCity")}</Label>
        <Input id="billing_city" name="billing_city" value={settings.billing_city ?? ""} onChange={onChange} disabled={disabled} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="billing_postcode">{t("billingPostcode")}</Label>
        <Input id="billing_postcode" name="billing_postcode" value={settings.billing_postcode ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shipping_first_name">{t("shippingFirstName")}</Label>
        <Input id="shipping_first_name" name="shipping_first_name" value={settings.shipping_first_name ?? ""} onChange={onChange} disabled={disabled} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shipping_last_name">{t("shippingLastName")}</Label>
        <Input id="shipping_last_name" name="shipping_last_name" value={settings.shipping_last_name ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shipping_company">{t("shippingCompany")}</Label>
        <Input id="shipping_company" name="shipping_company" value={settings.shipping_company ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shipping_phone">{t("shippingPhone")}</Label>
        <Input id="shipping_phone" name="shipping_phone" value={settings.shipping_phone ?? ""} onChange={onChange} disabled={disabled} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shipping_email">{t("shippingEmail")}</Label>
        <Input id="shipping_email" name="shipping_email" value={settings.shipping_email ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shipping_address_1">{t("shippingAddress1")}</Label>
        <Input id="shipping_address_1" name="shipping_address_1" value={settings.shipping_address_1 ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shipping_address_2">{t("shippingAddress2")}</Label>
        <Input id="shipping_address_2" name="shipping_address_2" value={settings.shipping_address_2 ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shipping_country">{t("shippingCountry")}</Label>
        <Input id="shipping_country" name="shipping_country" value={settings.shipping_country ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shipping_state">{t("shippingState")}</Label>
        <Input id="shipping_state" name="shipping_state" value={settings.shipping_state ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shipping_city">{t("shippingCity")}</Label>
        <Input id="shipping_city" name="shipping_city" value={settings.shipping_city ?? ""} onChange={onChange} disabled={disabled} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shipping_postcode">{t("shippingPostcode")}</Label>
        <Input id="shipping_postcode" name="shipping_postcode" value={settings.shipping_postcode ?? ""} onChange={onChange} disabled={disabled} required />
      </div>





    </div>
  );
};
