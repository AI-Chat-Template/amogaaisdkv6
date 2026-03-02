/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import React from "react";
import { Cell, Label, Pie, PieChart } from "recharts";
import { executeSqlQuery } from "../../lib/actions";

export interface DataProps {
  id: string;
  name: string;
  description: string;
  chartType: string;
  query: string;
  api: string;
}

const colorPalette = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
  "#00c49f",
];

const RenderPieChart = ({
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

  const generatePieChart = () => {
    if (!storyTemplate) return "";

    const template: any = storyTemplate && storyTemplate?.split("\n");

    const pieChartTemplateIndex = template.findIndex(
      (line: string) =>
        line.includes("CHART: Pie Chart") ||
        line.toLowerCase().includes("pie chart")
    );
    if (!pieChartTemplateIndex) return "";
    let story = template
      .slice(pieChartTemplateIndex, pieChartTemplateIndex + 2)
      .join("\n")
      .split("p |")[1];

    // Replace any #{value} placeholders with actual values from chartData
    story = story.replace(/#{(\w+)}/g, (match: string, key: string): string => {
      interface ChartItem {
        name: string;
        value: number;
      }
      const item: ChartItem | undefined = chartData.find(
        (d: ChartItem) => d.name.toLowerCase() === key.toLowerCase()
      );
      return item ? item.value.toString() : match;
    });

    return story;
  };

  React.useEffect(() => {
    if (contentJson[0]?.type === "graphql") {
      const { api, query } = data;

      const fetchGraphql = async () => {
        try {
          const response = await fetch("/api/boards/graphql", {
            method: "POST",
            body: JSON.stringify({ api, query }),
          });

          const result = await response.json();

          const orders = result || [];

          if (!Array.isArray(orders)) return;

          const countByDate = orders.reduce((acc: any, order: any) => {
            const date = new Date(order.createdAt).toISOString().split("T")[0]; // get yyyy-mm-dd
            if (!acc[date]) {
              acc[date] = { name: date, value: 0 };
            }
            acc[date].value += 1;
            return acc;
          }, {});

          const transformedData = Object.values(countByDate);

          setChartData(transformedData);
          setChartsData((prevData: any) => ({
            ...prevData,
            pieChart: { data: transformedData, label: "Orders By Date" },
          }));

          // Create dynamic color config
          if (transformedData.length > 0) {
            const newConfig: ChartConfig = {};
            transformedData.forEach((item: any, index: number) => {
              newConfig[item.name] = {
                label: item.name,
                color: colorPalette[index % colorPalette.length],
              };
            });
            setChartConfig(newConfig);
          }
        } catch (error) {
          console.error("Error fetching GraphQL data:", error);
        }
      };

      fetchGraphql();
    }
  }, [contentJson, data, setChartsData]);

  React.useEffect(() => {
    if (contentJson[0]?.type === "db") {
      const fetchData = async () => {
        try {
          if (data.query) {
            const result = await executeSqlQuery(data.query);

            // Get the first row to determine the field to use
            const firstRow = result[0]?.data[0];
            if (!firstRow) return;

            // Get the first field from the data (assuming this is the field we want to count)
            const field = Object.keys(firstRow)[0];

            // Transform the data to count occurrences of each unique value
            const countData = result[0]?.data.reduce((acc: any, curr: any) => {
              const value = curr[field];
              if (!acc[value]) {
                acc[value] = {
                  name: value,
                  value: 0,
                };
              }
              acc[value].value += 1;
              return acc;
            }, {});

            // Convert to array format
            const transformedData = Object.values(countData);

            setChartData(transformedData);
            setChartsData((prevData: any) => ({
              ...prevData,
              pieChart: { data: transformedData, label: result[0]?.label },
            }));

            // Generate dynamic chart config
            if (transformedData.length > 0) {
              const newConfig: ChartConfig = {};
              transformedData.forEach((item: any, index: number) => {
                newConfig[item.name] = {
                  label: item.name,
                  color: colorPalette[index % colorPalette.length],
                };
              });
              setChartConfig(newConfig);
            }
          }
        } catch (error) {
          console.error("Error fetching pie chart data:", error);
          throw error;
        }
      };

      fetchData();
    }
  }, [data.query, setChartsData, contentJson]);

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
          const inferredChartType = result.length <= 5 ? "pie" : "bar"; // simple example

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
    <div className="mt-2">
      <Card className="p-2.5">
        <CardContent>
          <h1 className="text-lg font-medium">{data?.name}</h1>
          <p className="text-muted-foreground">{data?.description}</p>

          <ChartContainer config={chartConfig}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={chartData}
                dataKey={chartConfig.valueKey}
                nameKey={chartConfig.labelKey}
                cx="50%"
                cy="50%"
                innerRadius={60}
                // outerRadius={80}
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colorPalette[index % colorPalette.length]}
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      const total = chartData.reduce(
                        (sum, item) => sum + (item[chartConfig.valueKey] ?? 0),
                        0
                      );
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
                            {total}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Total
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
          <p>{generatePieChart()}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RenderPieChart;
