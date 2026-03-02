/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { DataProps } from "./PieChart";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const RenderAreaChart = ({
  data,
  setChartsData,
}: {
  data: DataProps;
  setChartsData: any;
}) => {
  const chartData = [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
  ];

  setChartsData((prevData: any) => ({
    ...prevData,
    areaChart: chartData,
  }));

  const chartConfig = {
    desktop: {
      label: "desktop",
      color: "lightblue",
    },
    mobile: {
      label: "mobile",
      color: "green",
    },
  } satisfies ChartConfig;
  return (
    <div className="">
      <Card className="p-2.5">
        <CardContent>
          <h1 className="text-lg font-medium">{data?.name}</h1>
          <p className="text-muted-foreground">{data?.description}</p>
          <ChartContainer config={chartConfig}>
            <ChartContainer config={chartConfig}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <YAxis />
                <Area
                  dataKey="desktop"
                  type={"natural"}
                  stroke={chartConfig.desktop.color}
                  fillOpacity={0.2}
                  strokeWidth={2}
                  stackId={"a"}
                  fill={chartConfig.desktop.color}
                />
                <Area
                  dataKey="mobile"
                  type={"natural"}
                  stroke={chartConfig.mobile.color}
                  fillOpacity={0.2}
                  strokeWidth={2}
                  stackId={"a"}
                  fill={chartConfig.mobile.color}
                />
              </AreaChart>
            </ChartContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RenderAreaChart;
