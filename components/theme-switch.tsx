"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

const APPEARANCE = ["system", "dark"];
const COLORS = ["default", "green", "twitter", "vercel","neo"];

// Map color state to theme string
const COLOR_TO_THEME: Record<string, string> = {
  default: "root",
  vercel: "vercel",
  green: "green",
  twitter: "twitter",
  neo: "neo",
};

// Reverse map theme string to color state
const THEME_TO_COLOR: Record<string, string> = {
  root: "default",
  vercel: "vercel",
  green: "green",
  twitter: "twitter",
  neo:"neo"
};

export function ThemeSwitch() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [appearance, setAppearance] = useState("system");
  const [color, setColor] = useState("default");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !theme) return;

    let mode = "system";
    let tone = "default";

    if (theme.includes("-")) {
      const [m, t] = theme.split("-");
      mode = m === "dark" ? "dark" : "system";
      tone = THEME_TO_COLOR[t] || "default";
    } else {
      if (theme.startsWith("dark")) {
        mode = "dark";
        const t = theme.replace("dark-", "");
        tone = THEME_TO_COLOR[t] || "default";
      } else {
        mode = "system";
        tone = THEME_TO_COLOR[theme] || "default";
      }
    }

    setAppearance(mode);
    setColor(tone);
  }, [theme, mounted]);

  const handleAppearance = (mode: string) => {
    setAppearance(mode);
    const baseColor = COLOR_TO_THEME[color] || "root";
    if (mode === "dark") setTheme(`dark-${baseColor}`);
    else setTheme(baseColor === "root" ? "light-root" : baseColor);
  };

  const handleColor = (tone: string) => {
    setColor(tone);
    const baseTone = COLOR_TO_THEME[tone] || "root";
    if (appearance === "dark") setTheme(`dark-${baseTone}`);
    else setTheme(baseTone === "root" ? "light-root" : baseTone);
  };

  if (!mounted) return null;

  // ✅ Updated icon logic to show moon for any dark theme
  const icon =
    theme?.startsWith("dark") || resolvedTheme === "dark" ? (
      <Moon className="size-[1.2rem] text-white transition-all" />
    ) : (
      <Sun className="size-[1.2rem] text-yellow-500 transition-all" />
    );

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="scale-95 rounded-full relative">
          {icon}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Appearance Mode</DropdownMenuLabel>
        <DropdownMenuGroup>
          {APPEARANCE.map((t) => (
            <DropdownMenuItem key={t} onClick={() => handleAppearance(t)}>
              {t === "system" ? "Light" : "Dark"}
              <Check
                size={14}
                className={cn("ml-auto", appearance === t ? "opacity-100" : "hidden")}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
        <DropdownMenuGroup>
          {COLORS.map((t) => (
            <DropdownMenuItem key={t} onClick={() => handleColor(t)}>
              {t === "default" ? "Default" : t.charAt(0).toUpperCase() + t.slice(1)}
              <Check
                size={14}
                className={cn("ml-auto", color === t ? "opacity-100" : "hidden")}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
