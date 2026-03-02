import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import SalesTabClient from "./_components/sales_tab";
import OverviewTabClient from "./_components/overview_tab";
import { getRevenueData, getLeaderboardsData, getAiApiKey } from "./_actions";
import { dateToIsoString } from "@/lib/utils";

export default async function SalesAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const toDate = new Date();
  const fromDate = new Date(toDate.getFullYear(), toDate.getMonth(), 1);

  const from = (params.from as string) || dateToIsoString(fromDate);
  const to = (params.to as string) || dateToIsoString(toDate);

  // Fetch data in parallel
  const [revenueData, leaderboardsData, apiKeys] = await Promise.all([
    getRevenueData(from, to).catch(() => null),
    getLeaderboardsData(from, to).catch(() => null),
    getAiApiKey().catch(() => []),
  ]);

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
              <OverviewTabClient
                initialRapportData={revenueData}
                initialLeaderboardsData={leaderboardsData}
                initialApiKeys={apiKeys?.[0]}
                defaultDate={{ from: new Date(from), to: new Date(to) }}
              />
            </TabsContent>
            <TabsContent value="sales">
              <SalesTabClient
                initialRapportData={revenueData}
                initialApiKeys={apiKeys?.[0]}
                defaultDate={{ from: new Date(from), to: new Date(to) }}
              />
            </TabsContent>
            <TabsContent value="stories"></TabsContent>
            <TabsContent value="ask"></TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </>
  );
}