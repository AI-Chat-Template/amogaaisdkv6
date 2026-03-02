"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface OverviewProps {
  colors: string[];
}

interface ChartDataItem {
  browser: string;
  visitors: number;
  fill: string;
}

export const Overview: React.FC<OverviewProps> = ({ colors }) => {
  const chartData: ChartDataItem[] = React.useMemo(
    () => [
      { browser: "chrome", visitors: 275, fill: colors[0] },
      { browser: "safari", visitors: 200, fill: colors[1] },
      { browser: "firefox", visitors: 287, fill: colors[2] },
      { browser: "edge", visitors: 173, fill: colors[3] },
      { browser: "other", visitors: 190, fill: colors[4] },
    ],
    [colors]
  );

  const chartConfig: ChartConfig = React.useMemo(
    () => ({
      visitors: {
        label: "Visitors",
      },
      chrome: {
        label: "Chrome",
        color: colors[0],
      },
      safari: {
        label: "Safari",
        color: colors[1],
      },
      firefox: {
        label: "Firefox",
        color: colors[2],
      },
      edge: {
        label: "Edge",
        color: colors[3],
      },
      other: {
        label: "Other",
        color: colors[4],
      },
    }),
    [colors]
  );

  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, [chartData]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart - Donut with Text</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Visitors
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
};
