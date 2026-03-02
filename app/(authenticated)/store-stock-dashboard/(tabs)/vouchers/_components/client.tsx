/* eslint-disable */
"use client";
import { CardDataTable } from "./table/DataTableCard";
import { columns } from "./columns";
import * as React from "react";

interface VochersStockAnalyticsClientProps {
  analytics: [];
  totalPages?: number;
}

export const VochersStockAnalyticsClient: React.FC<
  VochersStockAnalyticsClientProps
> = ({ analytics, totalPages }) => {
  return (
    <>
      <div className="flex-1 flex-col space-y-8 md:p-8 md:flex">
        <CardDataTable
          columns={columns}
          data={analytics}
          setActiveTab={(value: any) => {}}
          totalPages={totalPages}
        />
      </div>
    </>
  );
};
