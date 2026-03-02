"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function ChatRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const newUuid = uuidv4();
    router.replace(`/chatwithwoodata/${newUuid}`);
  }, [router]);

  return <div className="text-start text-gray-500 pt-2">Redirecting...</div>;
}
