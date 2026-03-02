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
          Set store Roles and manager Users
        </p>
      </div>
      <Tabs
        defaultValue="roles"
        value={pathname}
        className="w-full md:w-96"
      >
        <TabsList className="grid w-full grid-cols-2">
          <Link href="/store-users/">
            <TabsTrigger className="w-full" value="/roles">
              Store Users
            </TabsTrigger>
          </Link>
          <Link href="/store-users/roles">
            <TabsTrigger className="w-full" value="/store-users/pages">
              Store Roles
            </TabsTrigger>
          </Link>
          {/* <Link href="/store-users/contacts">
            <TabsTrigger className="w-full" value="/store-users/contacts">
              Contacts
            </TabsTrigger>
          </Link> */}
        </TabsList>
      </Tabs>
      <div className="">{children}</div>
    </>
  );
}
