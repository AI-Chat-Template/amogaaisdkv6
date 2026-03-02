/* eslint-disable */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("en-US", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(new Date(date));
}

export function toSentenceCase(str: string) {
  return str
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @see https://github.com/radix-ui/primitives/blob/main/packages/core/primitive/src/primitive.tsx
 */
export function composeEventHandlers<E>(
  originalEventHandler?: (event: E) => void,
  ourEventHandler?: (event: E) => void,
  { checkForDefaultPrevented = true } = {}
) {
  return function handleEvent(event: E) {
    originalEventHandler?.(event);

    if (
      checkForDefaultPrevented === false ||
      !(event as unknown as Event).defaultPrevented
    ) {
      return ourEventHandler?.(event);
    }
  };
}

export function getPageTitle(pathname: string) {
  return pathname.replaceAll("Morr Appz", "").replaceAll("|", "");
}

export const fallbackImage = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export function formatPrice(
  price: number,
  currencyCode: string = "MYR"
): string {
  // Ensure the input is a number
  if (typeof price !== "number") {
    return "";
  }

  // let formatter = new Intl.NumberFormat("en-US", {
  //   style: "currency",
  //   currency: currencyCode,
  // });

  // return formatter.format(price);

  return price.toFixed(2);
}

export function dateToIsoString(date: Date | undefined): string {
  if (!date) return "";

  const adjustedDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return adjustedDate.toISOString();
}

export function uploaded_attachment_url(filename: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_BUCKET_URL || ""}${filename}`;
}