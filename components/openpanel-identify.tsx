"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function OpenPanelIdentify() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!window.op) return;

    const userCatalogId = session?.user?.user_catalog_id;

    if (!userCatalogId) return;

    window.op("identify", {
      profileId: String(userCatalogId),
    });
  }, [session]);

  return null;
}
