/* eslint-disable */
import { auth } from "@/auth";
import { Metadata } from "next";
import { VochersStockAnalyticsClient } from "./_components/client";
import callWooCommerceAPI from "@/lib/woocommerce";
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  SearchParams,
} from "nuqs/server";

export const metadata: Metadata = {
  title: "Stock Anaytics",
};

const searchParamsCache = createSearchParamsCache({
  search: parseAsString.withDefault(""),
  stock_status: parseAsArrayOf(parseAsString).withDefault([]),
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(2),
  orderby: parseAsString.withDefault("stock_status"),
  order: parseAsString.withDefault("asc"),
});

export default async function page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) return <h1>Nothing to show you 😞</h1>;

  const { search, per_page, page, stock_status, orderby, order } =
    searchParamsCache.parse(await searchParams);

  // const {
  //   data: analytics,
  //   error,
  //   pages,
  // } = await callWooCommerceAPI(
  //   `/woomorrintegration/v1/inventoryvoucher?business_number=${
  //     "BIZ015" || session.user.business_number
  //   }`
  // );
  const {
    data: analytics,
    error,
    pages,
  } = await callWooCommerceAPI(
    `/woomorrintegration/v1/inventoryvoucher?page=${page}&per_page=${per_page}`
  );

  if (error || typeof analytics !== "object") {
    console.error("Error fetching analytics:", error);
    return <h1>Nothing to show you 😞</h1>;
  }

  return (
    <>
      <VochersStockAnalyticsClient analytics={analytics} totalPages={pages} />
    </>
  );
}
