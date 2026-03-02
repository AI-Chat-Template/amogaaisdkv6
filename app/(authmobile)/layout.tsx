"use client";

import React from "react";
import { ThemeSwitch } from "@/components/theme-switch";
import LocaleSwitcher from "@/components/layout/locale-switcher/LocaleSwitcher";
import Info from "@/components/info";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative grid min-h-svh w-full grid-rows-[auto,1fr] bg-background">
      {/* Sticky header: flush right with controlled gaps */}
      <div className="sticky top-0 z-20 w-full py-2 sm:py-3 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex w-full flex-wrap items-center justify-end pr-2 sm:pr-4 gap-2 sm:gap-3">
          <ThemeSwitch />
          <LocaleSwitcher />
          <Info />
        </div>
      </div>

      {/* Main content */}
      <div className="flex w-md items-center justify-center px-3 py-6 sm:px-4 sm:py-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-4 flex items-center justify-center px-2 sm:mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-5 w-5 sm:h-6 sm:w-6 shrink-0"
              aria-hidden="true"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            <h1 className="text-base font-medium tracking-tight text-foreground sm:text-xl max-w-full truncate" title="Morr Store appz">
              Morr Store appz
            </h1>
          </div>

          <div className="space-y-3 sm:space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
