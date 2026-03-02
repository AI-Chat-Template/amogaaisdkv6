/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Cell, Pie, PieChart } from "recharts";

export const PieChartRender = ({ data, json }: { data: any; json: any }) => {
  const chartConfig = {
    status: {
      label: "Status",
      color: "blue",
    },
  } satisfies ChartConfig;

  const colors = ["blue", "green"];

  const transformedData = data.reduce((acc: any[], item: any) => {
    const existing = acc.find((entry) => entry.status === item.status);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ status: item.status, count: 1 });
    }
    return acc;
  }, []);

  return (
    <div>
      <h1>{json[0]?.charts[0]?.name}</h1>
      <ChartContainer config={chartConfig}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            dataKey="count"
            nameKey={"status"}
            data={transformedData}
            innerRadius={60}
            fill=""
          >
            {transformedData.map((entry: any, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
};
