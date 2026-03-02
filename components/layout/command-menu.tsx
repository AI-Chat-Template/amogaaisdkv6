"use client";
import React from "react";
import { useSearch } from "@/context/search-context";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ScrollArea } from "../ui/scroll-area";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Moon, Sun, Laptop, ArrowRightIcon, Loader2 } from "lucide-react";
import useSWR from "swr";
import { sidebarData } from "./sidebar-data";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CommandMenu() {
  const navigate = useRouter();
  const { setTheme } = useTheme();
  const { open, setOpen } = useSearch();

  const { data: pages, error, isLoading } = useSWR("/api/menu_pages", fetcher);

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false);
      command();
    },
    [setOpen]
  );

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <ScrollArea type="hover" className="h-72 pr-1">
          <CommandGroup heading="Pages">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-2">Failed to load</p>
            ) : pages?.length > 0 ? (
              <>
                {pages.map(
                  (navItem: {
                    pagelist_id: string | number;
                    page_name: string;
                    page_link: string;
                  }) => (
                    <CommandItem
                      key={navItem.pagelist_id}
                      value={navItem.page_name}
                      onSelect={() =>
                        runCommand(() => navigate.push(navItem.page_link))
                      }
                    >
                      <div className="mr-2 flex h-4 w-4 items-center justify-center">
                        <ArrowRightIcon className="size-2 text-muted-foreground/80" />
                      </div>
                      {navItem.page_name}
                    </CommandItem>
                  )
                )}
              </>
            ) : (
              <CommandEmpty>No pages available.</CommandEmpty>
            )}
          </CommandGroup>
          <CommandSeparator />
          {sidebarData.navGroups.map((group) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.map((navItem, i) => {
                if (navItem.url)
                  return (
                    <CommandItem
                      key={`${navItem.url}-${i}`}
                      value={navItem.title}
                      onSelect={() => {
                        runCommand(() => navigate.push(navItem.url));
                      }}
                    >
                      <div className="mr-2 flex h-4 w-4 items-center justify-center">
                        <ArrowRightIcon className="size-2 text-muted-foreground/80" />
                      </div>
                      {navItem.title}
                    </CommandItem>
                  );

                return navItem.items?.map((subItem, i) => (
                  <CommandItem
                    key={`${subItem.url}-${i}`}
                    value={subItem.title}
                    onSelect={() => {
                      runCommand(() => navigate.push(subItem.url));
                    }}
                  >
                    <div className="mr-2 flex h-4 w-4 items-center justify-center">
                      <ArrowRightIcon className="size-2 text-muted-foreground/80" />
                    </div>
                    {subItem.title}
                  </CommandItem>
                ));
              })}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <Sun /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <Moon className="scale-90" />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <Laptop />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  );
}
