import { getRequestConfig } from "next-intl/server";

export const locales = ['ar', 'fr', 'en', 'hi', 'ms', 'te', 'vi'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// ✅ Tell next-intl where to find your JSON files
export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default
}));
