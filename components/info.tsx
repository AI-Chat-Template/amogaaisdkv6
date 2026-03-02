"use client";

import * as React from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type InfoProps = {
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
};

export default function Info({
  className = "",
  align = "end",
  side = "bottom",
}: InfoProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="More options"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
        >
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={6}
        className="min-w-[180px]"
      >
        <DropdownMenuItem asChild>
          <Link href="/storesignin" className="w-full">
            Store Login
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/storesignup" className="w-full">
            Store Signup
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/help" className="w-full">
            Help
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/support/chat" className="w-full">
            Support Chat
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
