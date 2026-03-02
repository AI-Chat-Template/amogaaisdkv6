"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React, { useEffect } from "react";

export default function StockAnaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = usePathname();
  const [activeTab, setActiveTab] = React.useState("");

  useEffect(() => {
    const pathParts = router.split("/");
    setActiveTab(pathParts[pathParts.length - 1]);
  }, [router]);
  return (
    <>
      <div className="flex-1 space-y-4  p-4 md:p-8 pt-6">
        <Tabs className="w-full" value={activeTab}>
          <TabsList>
            <TabsTrigger
              value="store-stock-dashboard"
              onClick={(event) => {
                event.preventDefault();
                setActiveTab("store-stock-dashboard");
              }}
            >
              <Link href={"/store-stock-dashboard"}>Stock in Store</Link>
            </TabsTrigger>
          </TabsList>
          <TabsList>
            <TabsTrigger
              value="vouchers"
              onClick={(event) => {
                event.preventDefault();
                setActiveTab("vouchers");
              }}
            >
              <Link href={"/store-stock-dashboard/vouchers"}>Vouchers</Link>
            </TabsTrigger>
          </TabsList>
          {/* <TabsList>
            <TabsTrigger
              value="movement"
              onClick={(event) => {
                event.preventDefault();
                setActiveTab("movement");
              }}
            >
              <Link href={"/store-stock-dashboard/movement"}>Movement</Link>
            </TabsTrigger>
          </TabsList>
          <TabsList>
            <TabsTrigger
              value="stock_board"
              onClick={(event) => {
                event.preventDefault();
                setActiveTab("stock_board");
              }}
            >
              <Link href={"/store-stock-dashboard/stock_board"}>Stock Board</Link>
            </TabsTrigger>
          </TabsList> */}
          {/* <TabsContent value={activeTab}></TabsContent> */}
        </Tabs>
        <NuqsAdapter>{children}</NuqsAdapter>
      </div>
    </>
  );
}
