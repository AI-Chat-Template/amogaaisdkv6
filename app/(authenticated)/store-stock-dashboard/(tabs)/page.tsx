import callWooCommerceAPI from "@/lib/woocommerce";
import {
  parseAsString,
  parseAsArrayOf,
  parseAsInteger,
  createSearchParamsCache,
  SearchParams,
} from "nuqs/server";
import { Metadata } from "next";
import { auth } from "@/auth";
import { StockAnalyticsClient } from "./_components/client";

export const metadata: Metadata = {
  title: "Stock Anaytics",
};

const searchParamsCache = createSearchParamsCache({
  search: parseAsString.withDefault(""),
  stock_status: parseAsArrayOf(parseAsString).withDefault([]),
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(10),
  orderby: parseAsString.withDefault("stock_status"),
  order: parseAsString.withDefault("asc"),
});

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth();
  if (!session?.user) return <h1>Nothing to show you 😞</h1>;
  const asearchParams = await searchParams;

  const { search, per_page, page, stock_status, orderby, order } =
    await searchParamsCache.parse(asearchParams);
  // Build query string for WooCommerce API
  const params = new URLSearchParams({
    orderby: orderby,
    order: order,
    page: String(page),
    per_page: String(per_page),
    // type: "all",
    _locale: "user",
    // business_number: session.user.business_number || "",
  });
  if (search) params.append("search", search);
  if (stock_status.length > 0) {
    params.append("type", stock_status[0]);
  }

  const {
    data: analytics,
    error,
    pages,
  } = await callWooCommerceAPI(
    `/wc-analytics/reports/stock?${params.toString()}`
  );

  console.log("params.toString()", params.toString());

  if (error || typeof analytics !== "object")
    return <h1>Nothing to show you 😞</h1>;
  return (
    <>
      <StockAnalyticsClient
        analytics={analytics}
        search={search}
        perPage={per_page}
        page={page}
        stockStatus={stock_status}
        totalPages={pages || 1}
      />
    </>
  );
}
