"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const GA_ID = "G-62YDHV6JTL";

export function GA4Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!(window as any).gtag) return;

    const url =
      pathname +
      (searchParams.toString() ? `?${searchParams.toString()}` : "");

    // ✅ THIS IS THE FIX
    (window as any).gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
