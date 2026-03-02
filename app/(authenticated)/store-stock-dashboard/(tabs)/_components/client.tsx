"use client";
import { columns } from "./columns";
import * as React from "react";
import { DataTable } from "./table/DataTable";
import {
  parseAsString,
  parseAsArrayOf,
  parseAsInteger,
  useQueryState,
} from "nuqs";
import { getStockReportStats } from "../actions";

interface StockAnalyticsClientProps {
  analytics: unknown[];
  search: string;
  perPage: number;
  page: number;
  stockStatus: string[];
  totalPages?: number;
}

export const StockAnalyticsClient: React.FC<StockAnalyticsClientProps> = ({
  analytics,
  totalPages = 1,
}) => {
  const [stockStatusState, setStockStatusState] = React.useState({});

  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );
  const [perPage, setPerPage] = useQueryState(
    "per_page",
    parseAsInteger.withDefault(10).withOptions({ shallow: false })
  );
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({ shallow: false })
  );
  const [stockStatus, setStockStatus] = useQueryState(
    "stock_status",
    parseAsArrayOf(parseAsString)
      .withDefault([])
      .withOptions({ shallow: false })
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handlePerPage = (value: number) => setPerPage(value);
  const handlePage = (value: number) => setPage(value);
  const handleStockStatus = (values: string[]) => {
    setStockStatus(values);
    setPage(1);
  };

  React.useEffect(() => {
    getStockReportStats().then((stats: Record<string, unknown>) => {
      if (stats && stats?.data?.totals) {
        setStockStatusState(stats.data?.totals || {});
      }
    });
  }, []);

  return (
    <div className="flex-1 flex-col md:flex">
      <DataTable
        data={analytics}
        columns={columns}
        setActiveTab={() => {}}
        search={search}
        perPage={perPage}
        page={page}
        stockStatus={stockStatus}
        onSearch={handleSearch}
        onPerPage={handlePerPage}
        onPage={handlePage}
        onStockStatus={handleStockStatus}
        totalPages={totalPages}
        stockStatusState={stockStatusState}
      />
    </div>
  );
};
