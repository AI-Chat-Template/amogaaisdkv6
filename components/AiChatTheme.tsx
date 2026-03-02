"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

//--------------------------------------------------
// TYPES
//--------------------------------------------------
type AppearanceMode = "system" | "light" | "dark";
type ColorTone = "default" | "green" | "twitter" | "vercel" | "neo";

//--------------------------------------------------
// CONSTANTS
//--------------------------------------------------
const APPEARANCE: AppearanceMode[] = ["system", "light", "dark"];
const COLORS: ColorTone[] = ["default", "green", "twitter", "vercel", "neo"];

// LIGHT classes
const COLOR_TO_THEME: Record<ColorTone, string> = {
  default: "root",
  green: "green",
  twitter: "twitter",
  vercel: "vercel",
  neo: "neo",
};

const THEME_TO_COLOR: Record<string, ColorTone> = {
  root: "default",
  green: "green",
  twitter: "twitter",
  vercel: "vercel",
  neo: "neo",
};

//--------------------------------------------------
// COMPONENT
//--------------------------------------------------
export default function AiChatTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [appearance, setAppearance] = useState<AppearanceMode>("system");
  const [color, setColor] = useState<ColorTone>("default");

  //--------------------------------------------------
  // MOUNT
  //--------------------------------------------------
  useEffect(() => setMounted(true), []);

  //--------------------------------------------------
  // LOAD SAVED APPEARANCE
  //--------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem("appearance-mode") as AppearanceMode;
    if (saved) setAppearance(saved);
  }, []);

  //--------------------------------------------------
  // READ THEME (NO OVERRIDING SYSTEM)
  //--------------------------------------------------
  useEffect(() => {
    if (!mounted || !theme) return;

    let mode: AppearanceMode = appearance;
    let tone: ColorTone = color;

    if (theme.includes("-")) {
      const [prefix, col] = theme.split("-");
      const ct = THEME_TO_COLOR[col] || "default";
      tone = ct;
      mode = prefix === "dark" ? "dark" : "light";
    } else {
      tone = THEME_TO_COLOR[theme] || "default";
      // DO NOT OVERRIDE MODE → system stays system
    }

    setAppearance(mode);
    setColor(tone);
  }, [theme, mounted]);

  //--------------------------------------------------
  // APPLY THEME → FINAL RULES
  //--------------------------------------------------
  const applyTheme = (mode: AppearanceMode, tone: ColorTone) => {
    const base = COLOR_TO_THEME[tone];

    // LIGHT
    if (mode === "light") {
      setTheme(base); // green
      return;
    }

    // DARK
    if (mode === "dark") {
      setTheme(`dark-${base}`);
      return;
    }

    // SYSTEM → follow OS
    if (resolvedTheme === "dark") {
      setTheme(`dark-${base}`);
    } else {
      setTheme(base);
    }
  };

  //--------------------------------------------------
  // HANDLERS
  //--------------------------------------------------
  const handleAppearance = (mode: AppearanceMode) => {
    setAppearance(mode);
    localStorage.setItem("appearance-mode", mode);
    applyTheme(mode, color);
  };

  const handleColor = (tone: ColorTone) => {
    setColor(tone);
    applyTheme(appearance, tone);
  };

  if (!mounted) return null;

  //--------------------------------------------------
  // UI
  //--------------------------------------------------
  return (
    <div className="w-full max-w-[800px] mx-auto mt-6 space-y-6  sm:px-0">
      <div className="flex justify-end mb-2">
        <Button
          variant="default"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 "
        >
          <X className="w-4 h-4" />
          <span>Close</span>
        </Button>
      </div>

      <Card className="p-6 space-y-2">
        <h3 className="font-semibold text-lg">Appearance Mode</h3>
        <p className="text-sm text-muted-foreground">Choose how the app looks. 'System' will match your device's settings.</p>

        <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-row sm:flex-nowrap mt-3">
          {APPEARANCE.map((m) => (
            <Button
              key={m}
              variant={appearance === m ? "default" : "outline"}
              onClick={() => handleAppearance(m)}
              className="w-full py-2 text-sm"
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-2">
        <h3 className="font-semibold text-lg">Color Theme</h3>
        <p className="text-sm text-muted-foreground">Select a color accent for the user interface.</p>

        <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-row sm:flex-nowrap mt-3">
          {COLORS.map((c) => (
            <Button
              key={c}
              variant={color === c ? "default" : "outline"}
              onClick={() => handleColor(c)}
              className="w-full py-2 text-sm"
            >
              {c === "default" ? "Default" : c.charAt(0).toUpperCase() + c.slice(1)}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}