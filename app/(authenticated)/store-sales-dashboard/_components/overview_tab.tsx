/* eslint-disable */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dateToIsoString } from "@/lib/utils";
import * as React from "react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { toast } from "sonner";

interface OverviewTabClientProps {}

export default function OverviewTabClient({}: OverviewTabClientProps) {
  const [rapportData, setRapportData] = React.useState<{
    totals: { [x: string]: any };
    intervals: [];
  }>({
    totals: {},
    intervals: [],
  });
  const [chartData, setChartData] = React.useState<any>([]);
  const [leaderboardsData, setLeaderboardsData] = React.useState<any>([]);
  const [filterDate, setFilterDate] = React.useState<DateRange | undefined>();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [erorr, setError] = React.useState<string>("");

  const formatDate = (inputDate: any) => {
    const date = new Date(inputDate);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };
   const updateSalesData = async (from?: Date, to?: Date) => {
  const fromDate = dateToIsoString(filterDate?.from || from);
  const toDate = dateToIsoString(filterDate?.to || to);

  setLoading(true);
  try {
    // Revenue
    const revRes = await fetch(`/api/store-sales-dashboard/getrevenue?from=${fromDate}&to=${toDate}`);
    const revData = await revRes.json();

    if (!revData.success) throw new Error("Failed to fetch revenue data");
    setRapportData(revData.data);

    const chartd = revData.data?.intervals?.map((i: any) => ({
      name: formatDate(i.interval),
      ...i.subtotals,
    }));
    setChartData(chartd);

    // Leaderboards
    const lbRes = await fetch(`/api/store-sales-dashboard/getLeaderboards?from=${fromDate}&to=${toDate}`);
    const lbData = await lbRes.json();
    if (lbData.success) setLeaderboardsData(lbData.data);
    else setLeaderboardsData([]);

  } catch (error) {
    console.error(error);
    toast.error("Error fetching overview data");
  } finally {
    setLoading(false);
  }
};


  React.useEffect(() => {
    console.log("filterDate", filterDate);
  }, [filterDate]);

  React.useEffect(() => {
    const to_date = new Date();
    const from_date = new Date(to_date.getFullYear(), to_date.getMonth(), 1);

    setFilterDate({
      from: from_date,
      to: to_date,
    });
    updateSalesData(from_date, to_date);
  }, []);

  const getLeaderboardData = (name: string) => {
    if (!leaderboardsData) return;
    return leaderboardsData.find(
      (obj: { [x: string]: any }) => obj["id"] === name
    );
  };
  if (loading)
    return (
      <>
        {" "}
        <h1>loading ..</h1>
      </>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 justify-end">
        <DatePickerWithRange date={filterDate} setDate={setFilterDate} />
        <Button
          onClick={() => {
            updateSalesData();
          }}
        >
          Update
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {/* total_sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">
              Total sales
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ResponsiveContainer
              className="min-h-[200px]"
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <XAxis dataKey="name" />
                {/* <YAxis /> */}
                <Tooltip
                  wrapperStyle={
                    {
                      color: "black",
                    } as React.CSSProperties
                  }
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="total_sales"
                  // stroke="#82ca9d"
                  activeDot={{
                    r: 6,
                    style: { fill: "var(--theme-primary)", opacity: 0.25 },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* net_revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">
              Net sales
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ResponsiveContainer
              className="min-h-[200px]"
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <XAxis dataKey="name" />
                {/* <YAxis /> */}
                <Tooltip
                  wrapperStyle={
                    {
                      color: "black",
                    } as React.CSSProperties
                  }
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="net_revenue"
                  // stroke="#82ca9d"
                  activeDot={{
                    r: 6,
                    style: { fill: "var(--theme-primary)", opacity: 0.25 },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* orders_count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">Orders</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ResponsiveContainer
              className="min-h-[200px]"
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <XAxis dataKey="name" />
                {/* <YAxis /> */}
                <Tooltip
                  wrapperStyle={
                    {
                      color: "black",
                    } as React.CSSProperties
                  }
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="orders_count"
                  // stroke="#82ca9d"
                  activeDot={{
                    r: 6,
                    style: { fill: "var(--theme-primary)", opacity: 0.25 },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* avg_order_value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">
              Average order value
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ResponsiveContainer
              className="min-h-[200px]"
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <XAxis dataKey="name" />
                {/* <YAxis /> */}
                <Tooltip
                  wrapperStyle={
                    {
                      color: "black",
                    } as React.CSSProperties
                  }
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="avg_order_value"
                  // stroke="#82ca9d"
                  activeDot={{
                    r: 6,
                    style: { fill: "var(--theme-primary)", opacity: 0.25 },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* num_items_sold */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">
              Items sold
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ResponsiveContainer
              className="min-h-[200px]"
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <XAxis dataKey="name" />
                {/* <YAxis /> */}
                <Tooltip
                  wrapperStyle={
                    {
                      color: "black",
                    } as React.CSSProperties
                  }
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="num_items_sold"
                  // stroke="#82ca9d"
                  activeDot={{
                    r: 6,
                    style: { fill: "var(--theme-primary)", opacity: 0.25 },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* refunds */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">
              Returns
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ResponsiveContainer
              className="min-h-[200px]"
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <XAxis dataKey="name" />
                {/* <YAxis /> */}
                <Tooltip
                  wrapperStyle={
                    {
                      color: "black",
                    } as React.CSSProperties
                  }
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="refunds"
                  // stroke="#82ca9d"
                  activeDot={{
                    r: 6,
                    style: { fill: "var(--theme-primary)", opacity: 0.25 },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* shipping */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">
              Shipping
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ResponsiveContainer
              className="min-h-[200px]"
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <XAxis dataKey="name" />
                {/* <YAxis /> */}
                <Tooltip
                  wrapperStyle={
                    {
                      color: "black",
                    } as React.CSSProperties
                  }
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="shipping"
                  // stroke="#82ca9d"
                  activeDot={{
                    r: 6,
                    style: { fill: "var(--theme-primary)", opacity: 0.25 },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* coupons_count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">
              Discounted orders
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ResponsiveContainer
              className="min-h-[200px]"
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <XAxis dataKey="name" />
                {/* <YAxis /> */}
                <Tooltip
                  wrapperStyle={
                    {
                      color: "black",
                    } as React.CSSProperties
                  }
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="coupons_count"
                  // stroke="#82ca9d"
                  activeDot={{
                    r: 6,
                    style: { fill: "var(--theme-primary)", opacity: 0.25 },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* taxes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">Taxes</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <ResponsiveContainer
              className="min-h-[200px]"
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <XAxis dataKey="name" />
                {/* <YAxis /> */}
                <Tooltip
                  wrapperStyle={
                    {
                      color: "black",
                    } as React.CSSProperties
                  }
                />
                <Line
                  type="monotone"
                  strokeWidth={2}
                  dataKey="taxes"
                  // stroke="#82ca9d"
                  activeDot={{
                    r: 6,
                    style: { fill: "var(--theme-primary)", opacity: 0.25 },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 pt-14">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">
              Top products - Items sold
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Items sold</TableHead>
                  <TableHead>Net sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(getLeaderboardData("products")?.["rows"] || []).map(
                  (product: any, index: any) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {product?.[0]?.value}
                      </TableCell>
                      <TableCell>{product?.[1]?.value}</TableCell>
                      <TableCell>{product?.[2]?.value}</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">
              Top Customers - Total Spend
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(getLeaderboardData("customers")?.["rows"] || []).map(
                  (product: any, index: any) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {product?.[0]?.value}
                      </TableCell>
                      <TableCell>{product?.[1]?.value}</TableCell>
                      <TableCell>{product?.[2]?.value}</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">
              Top categories - Items sold
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Items sold</TableHead>
                  <TableHead>Net sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(getLeaderboardData("categories")?.["rows"] || []).map(
                  (product: any, index: any) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {product?.[0]?.value}
                      </TableCell>
                      <TableCell>{product?.[1]?.value}</TableCell>
                      <TableCell>{product?.[2]?.value}</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-[1.25rem]">
              Top Coupons - Number of Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coupon code</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Amount discounted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(getLeaderboardData("coupons")?.["rows"] || []).map(
                  (product: any, index: any) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {product?.[0]?.value}
                      </TableCell>
                      <TableCell>{product?.[1]?.value}</TableCell>
                      <TableCell>{product?.[2]?.value}</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
