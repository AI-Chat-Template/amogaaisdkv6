"use server";

import { getRevenueReportsData as getRevenue, getLeaderboardsData as getLeaderboards, getApiKey as getAiKey } from "@/app/(authenticated)/store-sales-dashboard/actions";

// Maintain ephemeral state to match legacy API behavior (Note: This is not persistent across serverless invocations)
let dashboardDataStore: {
    chartData?: unknown[];
    leaderboardsData?: unknown[];
    rapportData?: unknown[];
    apiKeys?: unknown[];
} = {};

export async function getRevenueData(from: string, to: string) {
    const result = await getRevenue(from, to);
    if (result.error) throw new Error(result.error);
    return result.success;
}

export async function getLeaderboardsData(from: string, to: string) {
    const result = await getLeaderboards(from, to);
    if (result.error) throw new Error(result.error);
    return result.success;
}

export async function getAiApiKey() {
    const data = await getAiKey();
    if (!data || data.length === 0) return [];

    // Filter sensitive fields
    return data[0]?.aiapi_connection_json?.map((item: any) => ({
        provider: item.provider,
        model: item.model,
        default: item.default ?? false,
    })) ?? [];
}

export async function saveDashboardData(data: {
    chartData?: unknown[];
    leaderboardsData?: unknown[];
    rapportData?: unknown[];
    apiKeys?: unknown[];
}) {
    if (data.chartData) dashboardDataStore.chartData = data.chartData;
    if (data.leaderboardsData) dashboardDataStore.leaderboardsData = data.leaderboardsData;
    if (data.rapportData) dashboardDataStore.rapportData = data.rapportData;
    if (data.apiKeys) dashboardDataStore.apiKeys = data.apiKeys;

    return { success: true };
}

export async function getDashboardData() {
    return { data: dashboardDataStore };
}
