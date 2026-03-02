/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import RenderPieChart from "./charts/PieChart";
import RenderLineChart from "./charts/LineChart";
import RenderBarChart from "./charts/BarChart";
import RenderAreaChart from "./charts/AreaChart";

const RenderChartsComponent = ({
  charts,
  setChartsData,
  storyTemplate,
  contentJson,
  apiToken,
}: {
  storyTemplate: string;
  charts: any[];
  contentJson: any[];
  setChartsData: ({
    pieChart: [],
    areaChart: [],
    lineChart: [],
    barChart: [],
  }) => void;
  apiToken?: string;
}) => {
  const chartComponents: {
    [key: string]: React.FC<{
      data: any;
      contentJson: any[];
      setChartsData: ({
        pieChart: [],
        areaChart: [],
        lineChart: [],
        barChart: [],
      }) => void;
      storyTemplate: string;
      apiToken?: string;
    }>;
  } = {
    "pie-chart": RenderPieChart,
    "line-chart": RenderLineChart,
    "bar-chart": RenderBarChart,
    "area-chart": RenderAreaChart,
  };

  return (
    <div className="mt-4 w-full items-center grid grid-cols-1 md:grid-cols-1 space-y-2  ">
      {charts.map((chart) => {
        const ChartComponent = chartComponents[chart.chartType] || "";
        return (
          <div key={chart.id} className="mx-3 my-3">
            <ChartComponent
              data={chart}
              storyTemplate={storyTemplate}
              setChartsData={setChartsData}
              contentJson={contentJson}
              apiToken={apiToken}
            />
          </div>
        );
      })}
    </div>
  );
};

const RenderCharts = React.memo(RenderChartsComponent);

export default RenderCharts;
