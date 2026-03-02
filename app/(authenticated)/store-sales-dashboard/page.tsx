"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import SalesTabClient from "./_components/sales_tab";
import OverviewTabClient from "./_components/overview_tab";

export default function SalesAnalyticsSalesClient() {
  return (
    <>
      <ScrollArea className="h-full">
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Hi, Welcome back 👋
            </h2>
          </div>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="stories">Stories</TabsTrigger>
              <TabsTrigger value="ask">Ask</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <OverviewTabClient />
            </TabsContent>
            <TabsContent value="sales">
              <SalesTabClient />
            </TabsContent>
            <TabsContent value="stories"></TabsContent>
            <TabsContent value="ask"></TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </>
  );
}