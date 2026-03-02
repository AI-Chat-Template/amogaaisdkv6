"use client";

import { Toaster } from "sonner";
import { DialogModel } from "@/components/modal/global-model";

export default function ChatWithPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}

      {/* 🔔 Toast notifications (bottom-right corner) */}
      <Toaster
        richColors
        position="bottom-right" // 👈 Moved to bottom-right
        toastOptions={{
          style: { zIndex: 9999 },
          duration: 3000,
        }}
      />

      {/* 🧱 Global modal manager for this section */}
      <DialogModel />
    </>
  );
}
