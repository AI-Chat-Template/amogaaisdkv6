"use server";

import { auth } from "@/auth";
import { postgrest } from "@/lib/postgrest";
import woorest from "@/lib/woorest";
import { redirect } from "next/navigation";

export const getRevenueReportsData = async function (from: string, to: string) {
  try {
    const session = await auth();
    if (!session?.user.business_number) return redirect("/");
    const data = await woorest(
      `/wc-analytics/reports/revenue/stats?order=asc&interval=day&per_page=100&after=${from}&before=${to}&fields[0]=gross_sales&fields[1]=refunds&fields[2]=coupons&fields[3]=net_revenue&fields[4]=taxes&fields[5]=shipping&fields[6]=total_sales&fields[7]=avg_order_value&fields[8]=items_sold&fields[9]=orders_count&fields[10]=num_items_sold&fields[11]=total_tax&fields[12]=order_tax&fields[13]=shipping_tax&_locale=user&business_number=${session?.user.business_number}`
    );

    // const data = await woorest(
    //   `/wc-analytics/reports/revenue/stats?order=asc&interval=day&per_page=100&after=${from}&before=${to}&fields[0]=gross_sales&fields[1]=refunds&fields[2]=coupons&fields[3]=net_revenue&fields[4]=taxes&fields[5]=shipping&fields[6]=total_sales&_locale=user`
    // );

    return {
      success: data,
    };
  } catch {}
  return {
    error: "somthing went wrong",
  };
};

export const getLeaderboardsData = async function (from: string, to: string) {
  try {
    const session = await auth();
    if (!session?.user.business_number) return redirect("/");
    const data = await woorest(
      `/wc-analytics/leaderboards?after=${from}&before=${to}&per_page=6&persisted_query=%7B%22period%22%3A%22quarter%22%2C%22compare%22%3A%22previous_year%22%7D&_locale=user&business_number=${session?.user.business_number}`
    );

    return {
      success: data,
    };
  } catch {}
  return {
    error: "somthing went wrong",
  };
};

export async function navigate(tabName: string) {
  redirect(`/offers?tab=${tabName}`);
}

export async function getApiKey() {
  const session = await auth();
  try {
    const { data, error } = await postgrest
      .from("user_catalog" as any)
      .select("aiapi_connection_json")
      .eq("user_catalog_id", session?.user?.user_catalog_id);
    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}
