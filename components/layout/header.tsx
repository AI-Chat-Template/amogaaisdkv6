"use client";

import React from "react";
import { cn, getPageTitle } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import LocaleSwitcher from "./locale-switcher/LocaleSwitcher";
import { usePathname } from "next/navigation";
import { Search } from "./search";

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean;
  ref?: React.Ref<HTMLElement>;

  /**
   * Component to render at the end
   * This will be rendered on the right side of header.
   */
  endContent?: React.ReactNode;
}

export const Header = ({
  className,
  fixed,
  endContent,
  children,
  ...props
}: HeaderProps) => {
  const [pageTitle, setPageTitle] = React.useState("");
  const [offset, setOffset] = React.useState(0);
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop);
    };

    // Add scroll listener to the body
    document.addEventListener("scroll", onScroll, { passive: true });

    // Clean up the event listener on unmount
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  const updatePageTitle = React.useCallback(() => {
    setPageTitle(getPageTitle(document.title));
  }, []);

  React.useEffect(() => {
    const head = document.querySelector("head");
    const observer = new MutationObserver(updatePageTitle);
    if (head) {
      observer.observe(head, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, [updatePageTitle]);

  React.useEffect(() => {
    updatePageTitle();
    const timeoutId = setTimeout(() => {
      updatePageTitle();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname, updatePageTitle]);

  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row justify-between h-32 sm:h-16 items-center gap-3 bg-background p-4 pl-3 sm:gap-4",
        fixed && "header-fixed peer/header fixed z-50 w-[inherit] rounded-md",
        offset > 10 && fixed ? "shadow" : "shadow-none",
        className
      )}
      {...props}
    >
      <div className="flex justify-between items-center sm:gap-3 w-full">
        {isMobile && (
          <div className="flex gap-2">
            <SidebarTrigger
              variant="outline"
              className="scale-125 sm:scale-100"
            />
            <Separator orientation="vertical" className="h-6" />
          </div>
        )}
        <div className="">
          <h1 className="text-lg font-medium tracking-tight">
            {pageTitle}
          </h1>
        </div>
        <Search className="hidden sm:flex" />
        <div className={cn("flex items-center gap-2 sm:gap-4", className)}>
          {children}
          <LocaleSwitcher />
          {endContent}
        </div>
      </div>
      <Search className="flex sm:hidden" />
    </header>
  );
};

Header.displayName = "Header";
