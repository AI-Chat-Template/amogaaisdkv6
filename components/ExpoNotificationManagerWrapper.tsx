"use client";
import { useSession } from "next-auth/react";
import { ExpoNotificationManager } from "@/components/expo-notification-manager";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function ExpoNotificationManagerWrapper({
  hidden = true,
}: {
  hidden?: boolean;
}) {
  const { data: session, status: authStatus } = useSession();
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const [key, setKey] = useState(
    session?.user?.user_catalog_id ||
      (authStatus !== "loading" ? authStatus : pathname)
  );

  useEffect(() => {
    const wasAuthPage =
      prevPathRef.current === "/sign-in" || prevPathRef.current === "/sign-up";
    if (wasAuthPage && pathname !== prevPathRef.current) {
      // User navigated away from sign-in or sign-up, likely logged in
      setKey(
        (session?.user?.user_catalog_id ||
          (authStatus !== "loading" ? authStatus : pathname)) +
          "-" +
          Date.now()
      );
      setTimeout(() => {
        setKey(
          (session?.user?.user_catalog_id ||
            (authStatus !== "loading" ? authStatus : pathname)) +
            "-" +
            Date.now()
        );
      }, 5000);
    }
    prevPathRef.current = pathname;
  }, [pathname, session, authStatus]);

  return (
    <>
      <ExpoNotificationManager key={key} hidden={hidden} />
    </>
  );
}
