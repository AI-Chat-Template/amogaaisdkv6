import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { ThemeSwitch } from "@/components/theme-switch";
import { auth } from "@/auth";
import { NavUser } from "@/components/layout/nav-user";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProviderWrapper } from "./QueryProviderWrapper";
// import ClickTracker from "@/components/otel/ClickTracker";
import PageTracker from "@/components/otel/PageTracker";  
export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <div className="size-full">
        <QueryProviderWrapper>
      <SidebarProvider>
        <AppSidebar session={session} />
        <div
          id="content"
          className={cn(
            "ml-auto w-full max-w-full",
            "peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]",
            "peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]",
            "transition-[width] duration-200 ease-linear",
            "flex h-svh flex-col",
            "group-data-[scroll-locked=1]/body:h-full",
            "group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh"
          )}
        >
          <Header
            endContent={
              <NavUser
                key={"nav-user"}
                iconOnlyLabel={true}
                user={session?.user || null}
              />
            }
          >
            <div className="ml-auto flex items-center gap-4">
              {/* <ThemeSwitch /> */}
            </div>
          </Header>
          <NuqsAdapter>
              <PageTracker />
   
            <div className="pr-3 pl-3 h-full overflow-auto">{children}</div>
          </NuqsAdapter>
        </div>
      </SidebarProvider>
      </QueryProviderWrapper>
    </div>
  );
}
