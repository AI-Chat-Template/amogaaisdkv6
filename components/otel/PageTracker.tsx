"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/otel/log", {
      method: "POST",
      credentials: "include", 
      body: JSON.stringify({ event: "page_load", pathname }),
    });
  }, [pathname]);

  return null;
}
