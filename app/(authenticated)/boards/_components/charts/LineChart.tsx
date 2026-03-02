/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { executeSqlQuery } from "../../lib/actions";

const colorPalette = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
  "#00c49f",
];

export interface DataProps {
  id: string;
  name: string;
  description: string;
  chartType: string;
  query: string;
  api: string;
}

const RenderLineChart = ({
  data,
  setChartsData,
  storyTemplate,
  contentJson,
  apiToken,
}: {
  data: DataProps;
  setChartsData: any;
  storyTemplate: string;
  contentJson: any[];
  apiToken?: string;
}) => {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({});

  const generateLineChart = () => {
    if (!storyTemplate) return "";

    const template: any = storyTemplate && storyTemplate?.split("\n");

    const lineChartTemplateIndex = template.findIndex(
      (line: string) =>
        line.includes("CHART: Line Chart") ||
        line.toLowerCase().includes("line chart")
    );
    if (!lineChartTemplateIndex) return "";
    let story = template
      .slice(lineChartTemplateIndex, lineChartTemplateIndex + 2)
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
    if (contentJson[0]?.type === "graphql") {
      const { api, query } = data;
      const fetchGraphql = async () => {
        const response = await fetch("/api/boards/graphql", {
          method: "POST",
          body: JSON.stringify({ api, query }),
        });
        const result = await response.json();
        const parsedData = result.map((chart: any) => ({
          month: new Date(chart.createdAt).getMonth(),
          orders: chart.name,
        }));
        setChartData(parsedData);

        const newConfig: ChartConfig = {
          orders: {
            label: "Orders",
            color: colorPalette[0],
          },
        };

        setChartConfig(newConfig);
      };
      fetchGraphql();
    }
  }, [contentJson, data]);

  React.useEffect(() => {
    if (contentJson[0]?.type === "db") {
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
              lineChart: {
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
          throw error;
        }
      };

      fetchData();
    }
  }, [data.query, setChartsData, contentJson, chartData]);

  React.useEffect(() => {
    if (contentJson[0]?.type === "api") {
      const fetchApiData = async (api: string, cardName: string) => {
        try {
          const response = await fetch(api, {
            method: "GET",
            headers: {
              Authorization: apiToken!,
            },
          });
          const result = await response.json();

          if (!Array.isArray(result) || result.length === 0) return;

          const sample = result[0];

          // Dynamically extract keys
          const numericKeys = Object.keys(sample).filter(
            (key) => typeof sample[key] === "number"
          );
          const stringKeys = Object.keys(sample).filter(
            (key) =>
              typeof sample[key] === "string" || typeof sample[key] === "number"
          );

          const valueKey = numericKeys[0]; // fallback to first numeric field
          const labelKey =
            stringKeys.find((key) =>
              ["name", "title", "product_id", "id"].includes(key)
            ) || stringKeys[0]; // fallback to first string field

          // You can expand this logic for chart type inference
          const inferredChartType = "line"; // simple example

          // Set state (assuming setters exist in scope)
          setChartData(result);
          setChartConfig({
            valueKey,
            labelKey,
            chartType: inferredChartType,
          });
        } catch (error) {
          console.error(`Error fetching data for card ${cardName}:`, error);
        }
      };

      fetchApiData(data.api, data.name);
    }
  }, [contentJson, apiToken, data]);

  return (
    <div className="">
      <Card className="p-2.5">
        <CardContent>
          <h1 className="text-lg font-medium">{data?.name}</h1>
          <p className="text-muted-foreground">{data?.description}</p>

          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={chartConfig.labelKey} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />

                {/* Dynamically create lines for numeric fields except labelKey */}
                {chartData?.length > 0 &&
                  Object.keys(chartData[0])
                    .filter(
                      (key) =>
                        key !== chartConfig.labelKey &&
                        typeof chartData[0][key] === "number"
                    )
                    .map((key, idx) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={key}
                        stroke={colorPalette[idx % colorPalette.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          <p>{generateLineChart()}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RenderLineChart;
