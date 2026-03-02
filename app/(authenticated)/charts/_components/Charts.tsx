import React from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const Charts = ({ colors }: { colors: string[] }) => {
  const chartConfig = {
    desktop: {
      label: "desktop",
      color: colors[0],
    },
    mobile: {
      label: "mobile",
      color: colors[1],
    },
  } satisfies ChartConfig;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="max-w-[500px]">
        <h1>Area Chart</h1>
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
      </div>
      <div className="max-w-[500px]">
        <h1>Bar Chart - Mixed</h1>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <YAxis />
            <Bar
              dataKey="desktop"
              radius={4}
              fill={chartConfig.desktop.color}
            />
          </BarChart>
        </ChartContainer>
      </div>
      <div className="max-w-[500px]">
        <h1>Bar Chart - Multiple</h1>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <YAxis />
            <Bar
              dataKey="desktop"
              radius={4}
              fill={chartConfig.desktop.color}
            />
            <Bar dataKey="mobile" radius={4} fill={chartConfig.mobile.color} />
          </BarChart>
        </ChartContainer>
      </div>
      <div className="max-w-[500px]">
        <h1>Line Chart</h1>
        <ChartContainer config={chartConfig}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <YAxis />
            <Line
              type={"natural"}
              dataKey="desktop"
              radius={4}
              dot={false}
              stroke={chartConfig.desktop.color}
              strokeWidth={2}
            />
          </LineChart>
        </ChartContainer>
      </div>
      <div className="max-w-[500px]">
        <h1>Line Chart - Dots</h1>
        <ChartContainer config={chartConfig}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <YAxis />
            <Line
              type={"natural"}
              dataKey="desktop"
              radius={4}
              stroke={chartConfig.desktop.color}
              strokeWidth={2}
            />
          </LineChart>
        </ChartContainer>
      </div>

      <div className="max-w-[500px]">
        <h1>Donut Chart</h1>
        <ChartContainer config={chartConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              dataKey={"desktop"}
              data={chartData}
              innerRadius={60}
              strokeWidth={5}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
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
                          {"6 Months"}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total months
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
      </div>
      <div className="max-w-[500px]">
        <h1>Donut Chart - Legend</h1>
        <ChartContainer config={chartConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie dataKey={"desktop"} data={chartData} strokeWidth={5}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
              <Label
                content={({ value }) => {
                  return (
                    <text>
                      <tspan className="fill-foreground text-3xl font-bold">
                        {value}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="desktop" />} />
          </PieChart>
        </ChartContainer>
      </div>
      <div className="max-w-[500px]">
        <h1>Bar Chart - Custom Label</h1>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData} layout="vertical" accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" />

            <ChartTooltip content={<ChartTooltipContent />} />
            <YAxis dataKey="desktop" type="category" tickLine={false} hide />
            <XAxis dataKey={"desktop"} type="number" hide />
            <Bar
              dataKey="desktop"
              radius={4}
              layout="vertical"
              fill={chartConfig.desktop.color}
            >
              <LabelList
                className="text-white fill-foreground"
                dataKey="month"
                position="insideLeft"
                offset={8}
                fontSize={12}
              />
              <LabelList
                dataKey="desktop"
                position="right"
                offset={8}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
      <div className="max-w-[500px]">
        <h1>Bar Chart - Horizontal</h1>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData} layout="vertical" accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" />

            <ChartTooltip content={<ChartTooltipContent />} />
            <YAxis dataKey="month" type="category" />
            <XAxis dataKey={"desktop"} type="number" />
            <Bar
              dataKey="desktop"
              radius={4}
              layout="vertical"
              fill={chartConfig.desktop.color}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};

export default Charts;
