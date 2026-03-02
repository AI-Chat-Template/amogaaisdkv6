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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { executeSqlQuery } from "../../lib/actions";

const colorPalette = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
  "#00c49f",
];

const RenderBarChart = ({
  data,
  setChartsData,
  storyTemplate,
}: {
  data: DataProps;
  setChartsData: any;
  storyTemplate: string;
}) => {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({});

  const generatePieChart = () => {
    if (!storyTemplate) return "";

    const template: any = storyTemplate && storyTemplate?.split("\n");

    const barChartTemplateIndex = template.findIndex(
      (line: string) =>
        line.includes("CHART: Bar Chart") ||
        line.toLowerCase().includes("bar chart")
    );
    if (!barChartTemplateIndex) return "";
    let story = template
      .slice(barChartTemplateIndex, barChartTemplateIndex + 2)
      .join("\n")
      .split("p |")[1];

    // Replace any #{value} placeholders with actual values from chartData
    // Find the latest month's data
    const latestData =
      chartData?.length > 0 &&
      chartData.reduce((latest, current) => {
        return !latest || current.month > latest.month ? current : latest;
      });

    // Replace placeholders with actual values
    if (latestData) {
      story = story
        .replace("#{month}", latestData.month)
        .replace("#{user_count}", latestData.user_count.toString());
    }

    return story;
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        if (data.query) {
          const result = await executeSqlQuery(data.query);

          // Filter out null values and transform data
          const processedData = result[0]?.data
            .filter((item: any) => item.month !== null)
            .map((item: any) => ({
              month: item.month,
              user_count: parseInt(item.user_count, 10),
            }))
            .sort((a: any, b: any) => a.month.localeCompare(b.month));

          setChartData(processedData);
          setChartsData((prevData: any) => ({
            ...prevData,
            barChart: {
              data: processedData,
              label: result[0]?.label,
            },
          }));

          // Generate chart config
          const newConfig: ChartConfig = {
            user_count: {
              label: "User Count",
              color: colorPalette[0],
            },
          };

          setChartConfig(newConfig);
        }
      } catch (error) {
        console.error("Error fetching bar chart data:", error);
        throw error;
      }
    };

    fetchData();
  }, [data.query, setChartsData]);

  return (
    <div className="">
      <Card className="p-2.5">
        <CardContent>
          <h1 className="text-lg font-medium">{data?.name}</h1>
          <p className="text-muted-foreground">{data?.description}</p>
          <ChartContainer config={chartConfig}>
            <BarChart width={600} height={300} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="user_count"
                fill={colorPalette[0]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
          <p>{generatePieChart()}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RenderBarChart;
