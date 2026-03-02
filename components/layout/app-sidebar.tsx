"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavGroup } from "@/components/layout/nav-group";
import { NavUser } from "@/components/layout/nav-user";
import { sidebarData } from "./sidebar-data";
import { LayoutDashboard } from "lucide-react";
import { Session } from "next-auth";

export function AppSidebar({
  session,
  ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session | null }) {
  const { state } = useSidebar();
  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <div className="flex w-full justify-between items-center">
          {/* Use asChild to avoid nested buttons */}
          <SidebarMenuButton
            size="lg"
            asChild
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex gap-2 items-center w-full">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutDashboard className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {session?.user?.business_name}
                </span>
                <span className="truncate text-xs">
                  {session?.user?.app_name ?? "My Apps"}
                </span>
              </div>
            </div>
          </SidebarMenuButton>

          {/* Only show trigger if sidebar is not collapsed */}
          {state !== "collapsed" && (
            <SidebarTrigger
              variant="outline"
              className="scale-125 sm:scale-100 size-7 p-1 m-2"
            />
          )}
        </div>

        {/* Collapsed state: use asChild to avoid nested button */}
        {state === "collapsed" && (
          <SidebarMenuButton size="lg" asChild className="data-[state=open]:hidden">
            <div className="flex aspect-square size-8 items-center justify-center">
              <SidebarTrigger
                variant="outline"
                className="scale-125 sm:scale-100"
              />
            </div>
          </SidebarMenuButton>
        )}
      </SidebarHeader>

      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={session?.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
