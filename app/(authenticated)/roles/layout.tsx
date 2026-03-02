"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RolePageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  return (
    <>
      <div className="pb-2">
        <p className="text-muted-foreground">
          Set Roles, Pages and manager Users
        </p>
      </div>
      <Tabs
        defaultValue="roles"
        value={pathname}
        className="w-full md:w-96"
      >
        <TabsList className="grid w-full grid-cols-3">
          <Link href="/roles/">
            <TabsTrigger className="w-full" value="/roles">
              Roles
            </TabsTrigger>
          </Link>
          <Link href="/roles/pages">
            <TabsTrigger className="w-full" value="/roles/pages">
              Pages
            </TabsTrigger>
          </Link>
          <Link href="/roles/contacts">
            <TabsTrigger className="w-full" value="/roles/contacts">
              Contacts
            </TabsTrigger>
          </Link>
        </TabsList>
      </Tabs>
      <div className="">{children}</div>
    </>
  );
}
