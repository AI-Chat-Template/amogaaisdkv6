"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile, updateBusiness, handleAvatarUpload } from "./_lib/action";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Profile = {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  user_email: string;
  user_mobile: string | null;
  status: string | null;
  roles_json?: string[] | string | null;
  avatar_url?: string | null;
  business_name?: string | null;
  business_number?: string | null;
  for_business_name?: string | null;
  for_business_number?: string | null;
  business_address_1?: string | null;
  business_address_2?: string | null;
  business_city?: string | null;
  business_state?: string | null;
  business_postcode?: string | null;
  business_country?: string | null;
};

type BusinessState = {
  business_name: string;
  business_number: string;
  business_address_1: string;
  business_address_2: string;
  business_city: string;
  business_state: string;
  business_postcode: string;
  business_country: string;
};

type ActionResult<T> = { data: T | null; error: string | null };

function isProfile(x: unknown): x is Profile {
  return !!x && typeof x === "object" && "user_email" in (x as any);
}

function isBusinessSubset(x: unknown): x is Partial<BusinessState> {
  return !!x && typeof x === "object";
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [biz, setBiz] = useState<BusinessState>({
    business_name: "",
    business_number: "",
    business_address_1: "",
    business_address_2: "",
    business_city: "",
    business_state: "",
    business_postcode: "",
    business_country: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const t=useTranslations("ProfileSettings");
  // Fetch profile on mount
  useEffect(() => {
    (async () => {
      const res = (await getProfile()) as ActionResult<Profile>;
      if (res.error) {
        setErrMsg(res.error);
        toast.error(res.error);
      } else if (res.data && isProfile(res.data)) {
        const p = res.data;
        setProfile(p);
        setBiz({
          business_name: p.business_name || "",
          business_number: p.business_number || "",
          business_address_1: p.business_address_1 || "",
          business_address_2: p.business_address_2 || "",
          business_city: p.business_city || "",
          business_state: p.business_state || "",
          business_postcode: p.business_postcode || "",
          business_country: p.business_country || "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const fullName =
    profile?.full_name?.trim() ||
    `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();

  const initials =
    (profile?.first_name?.[0] ?? "").toUpperCase() +
    (profile?.last_name?.[0] ?? "").toUpperCase();

  async function handleSave() {
    setSaving(true);
    setErrMsg(null);

    let avatarResult: ActionResult<{ avatar_url: string | null }> | null = null;

    // Upload avatar only if a new file is selected
    if (selectedFile) {
      setAvatarUploading(true);
      const reader = new FileReader();
      avatarResult = await new Promise((resolve) => {
        reader.readAsDataURL(selectedFile);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          const result = await handleAvatarUpload({
            fileName: selectedFile.name,
            type: selectedFile.type,
            base64,
          });
          resolve(result);
        };
      });
      setAvatarUploading(false);
    }

    const res = (await updateBusiness(biz)) as ActionResult<
      Partial<BusinessState> & { for_business_name?: string | null; for_business_number?: string | null }
    >;

    if (res.error || avatarResult?.error) {
      const errorMsg = res.error || avatarResult?.error;
      setErrMsg(errorMsg ?? "Failed to save");
      toast.error(errorMsg ?? "Failed to save");
    } else {
      // Update local state
      if (res.data && isBusinessSubset(res.data)) {
        setProfile((prev) => (prev ? { ...prev, ...res.data } : prev));
        setBiz((prev) => ({
          ...prev,
          business_name: (res.data as any).business_name ?? prev.business_name,
          business_number: (res.data as any).business_number ?? prev.business_number,
        }));
      }

      if (avatarResult?.data?.avatar_url) {
        setProfile((prev) =>
          prev ? { ...prev, avatar_url: avatarResult.data!.avatar_url } : prev
        );
        setLocalAvatarUrl(null);
        setSelectedFile(null);
      }

      toast.success("Changes saved successfully.");
    }

    setSaving(false);
  }

  function handleChangePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrMsg(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setLocalAvatarUrl(reader.result as string);
      toast.success("Image fetched successfully. Click 'Save Changes' to update.");
    };

    if (fileRef.current) fileRef.current.value = "";
  }

  function handleCancelAvatar() {
    setSelectedFile(null);
    setLocalAvatarUrl(null);
    toast.success("Avatar change has been canceled.");
  }

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-4 pb-12">
        <div className="flex flex-col items-center gap-3 mt-10">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="mt-10 space-y-6">
          {[...Array(3)].map((_, idx) => (
            <Card key={idx} className="shadow-sm border border-border/60">
              <CardContent className="py-8 space-y-4">
                <Skeleton className="h-5 w-44" />
                {[...Array(5)].map((__, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-[800px] mx-auto px-4 pb-12 text-center mt-10">
        {errMsg ?? "No profile found."}
      </div>
    );
  }

  const rolesDisplay =
    Array.isArray(profile.roles_json)
      ? profile.roles_json.filter(Boolean).join(", ")
      : typeof profile.roles_json === "string"
      ? profile.roles_json
      : "—";

  return (
    <div className="max-w-[800px] mx-auto px-4 pb-12">
      {/* Header */}
      <header className="flex flex-col items-center mt-10">
        <Avatar className="h-24 w-24 ring-2 ring-black/5 shadow-sm">
          <AvatarImage
            src={localAvatarUrl || profile.avatar_url || undefined}
            alt={fullName || "User"}
            onError={(ev) => {
              (ev.target as HTMLImageElement).style.display = "none";
            }}
          />
          <AvatarFallback className="text-lg font-medium text-white bg-gradient-to-br from-zinc-400 via-zinc-500 to-zinc-700">
            {initials || "US"}
          </AvatarFallback>
        </Avatar>

        <div className="mt-3 flex items-center gap-3">
          <input
            ref={fileRef}
            id="avatarFile"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChangePhoto}
          />
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
          >
            {avatarUploading ? "Uploading..." : "Change Photo"}
          </Button>
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{fullName || "Profile"}</h1>
      </header>

      {/* Personal Info */}
      <section className="mt-10">
        <Card className="border border-border/60">
          <CardContent className="py-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
              <p className="text-sm text-muted-foreground">{t("description")}</p>
            </div>
            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <Label htmlFor="fullName">{t("fullName")}</Label>
                <Input id="fullName" value={fullName} readOnly />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" value={profile.user_email} readOnly />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="role">{t("Roles")}</Label>
                <Input id="role" value={rolesDisplay} readOnly />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="status">{t("status")}</Label>
                <Input id="status" value={profile.status || "N/A"} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Business Info */}
      <section className="mt-8 mb-12">
        <Card className="border border-border/60">
          <CardContent className="py-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">{t("businessInformation")}</h2>
              <p className="text-sm text-muted-foreground">{t("businessDescription")}</p>
            </div>
            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <Label htmlFor="bizNumber">{t("businessnumber")}</Label>
                <Input
                  id="bizNumber"
                  value={biz.business_number}
                  onChange={(e) => setBiz({ ...biz, business_number: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bizName">{t("businessname")}</Label>
                <Input
                  id="bizName"
                  value={biz.business_name}
                  onChange={(e) => setBiz({ ...biz, business_name: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="addr1">{t("address1")}</Label>
                <Input
                  id="addr1"
                  value={biz.business_address_1}
                  onChange={(e) => setBiz({ ...biz, business_address_1: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="addr2">{t("address2")}</Label>
                <Input
                  id="addr2"
                  value={biz.business_address_2}
                  onChange={(e) => setBiz({ ...biz, business_address_2: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="grid gap-1.5">
                  <Label htmlFor="city">{t("city")}</Label>
                  <Input
                    id="city"
                    value={biz.business_city}
                    onChange={(e) => setBiz({ ...biz, business_city: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="state">{t("state")}</Label>
                  <Input
                    id="state"
                    value={biz.business_state}
                    onChange={(e) => setBiz({ ...biz, business_state: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="grid gap-1.5">
                  <Label htmlFor="postcode">{t("postcode")}</Label>
                  <Input
                    id="postcode"
                    value={biz.business_postcode}
                    onChange={(e) => setBiz({ ...biz, business_postcode: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="country">{t("country")}</Label>
                  <Input
                    id="country"
                    value={biz.business_country}
                    onChange={(e) => setBiz({ ...biz, business_country: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Cancel Avatar */}
            {localAvatarUrl && (
              <div className="flex justify-between items-center mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <span>New avatar selected.</span>
                <Button variant="destructive" size="sm" onClick={handleCancelAvatar}>
                  Cancel
                </Button>
              </div>
            )}

            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
