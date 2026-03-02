import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { SearchProvider } from "@/context/search-context";
import { cn } from "@/lib/utils";
import { NotificationManager } from "@/components/notification-manager";
import { ExpoNotificationManagerWrapper } from "@/components/ExpoNotificationManagerWrapper";
import { DialogModel } from "@/components/modal/global-model";
import { OpenPanelComponent } from '@openpanel/nextjs';
import { OpenPanelIdentify } from "@/components/openpanel-identify";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Morr Appz",
    default: "Morr Appz",
  },
  description: "created by morr",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale || "en"} suppressHydrationWarning>

      <body
        className={cn(geistSans.variable, geistMono.variable, "antialiased")}
      >
        <OpenPanelComponent
          clientId="dc6621e0-a491-4950-be0a-8756e9172a5f"
          trackScreenViews={true}
          trackAttributes={true}
          trackOutgoingLinks={true}
        // If you have a user id, you can pass it here to identify the user
        // profileId={'123'}
        />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
            storageKey={undefined}
            themes={["light", "twitter", "green", "vercel", "neo", "dark-twitter", "dark-green", "dark-root", "dark-vercel", "dark-neo"]}
          >
            <SearchProvider>
              <SessionProvider>
                <OpenPanelIdentify />
                <NotificationManager />
                <ExpoNotificationManagerWrapper />

                {children}
              </SessionProvider>
            </SearchProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <Toaster richColors />
        <DialogModel />
      </body>
    </html>
  );
}
