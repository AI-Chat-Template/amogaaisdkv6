"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export interface ChartConfig {
  type: "bar" | "line" | "pie" | "doughnut";
  title?: string;
  data: {
    labels: any[];
    datasets: {
      label: string;
      data: any[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }[];
  };
  options?: Record<string, unknown>;
}

export interface TableColumn {
  key: string;
  header: string;
}

export interface TableData {
  title?: string;
  columns: TableColumn[];
  rows: Array<Record<string, unknown>>;
  summary?: string;
}

interface DataDisplayProps {
  title?: string;
  chartConfig?: ChartConfig;
  tableData?: TableData;
  className?: string;
}

const itemsPerPage = 10;

export default function DataDisplay({
  title = "Visualization",
  chartConfig,
  tableData,
  className = "",
}: DataDisplayProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");

  useEffect(() => {
    setCurrentPage(1);
  }, [tableData]);

  // Render chart safely
  const renderedChart = useMemo(() => {
    if (!chartConfig?.data || !chartConfig.data.datasets?.length) {
      return (
        <div className="text-muted-foreground p-4 text-center">
          No chart data
        </div>
      );
    }

    const { type, data, options } = chartConfig;

    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

    const datasets = data.datasets.map((d, i) => ({
      ...d,
      data: d.data.map((v) => Number(v) || 0),
      backgroundColor: d.backgroundColor || colors[i % colors.length],
      borderColor: d.borderColor || colors[i % colors.length],
      borderWidth: 2,
    }));

    const chartData = { labels: data.labels, datasets };

    switch (type) {
      case "bar":
        return <Bar data={chartData} options={options} />;
      case "line":
        return <Line data={chartData} options={options} />;
      case "pie":
        return <Pie data={chartData} options={options} />;
      case "doughnut":
        return <Doughnut data={chartData} options={options} />;
      default:
        return <Bar data={chartData} options={options} />;
    }
  }, [chartConfig]);

  // Render table
  const renderTable = () => {
    const isEmpty =
      !tableData?.columns ||
      !tableData?.rows ||
      !tableData.columns.length ||
      !tableData.rows.length;

    if (isEmpty) {
      return (
        <div className="text-muted-foreground p-4 text-center">
          No table data
        </div>
      );
    }

    const { columns, rows, summary } = tableData;

    const totalPages = Math.ceil(rows.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const sliced = rows.slice(start, start + itemsPerPage);

    return (
      <>
        <div className="w-full overflow-x-auto border rounded-xl">
          <table className="w-full border-collapse">
            <thead className="bg-muted/40 text-sm">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left font-medium">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sliced.map((row, idx) => (
                <tr key={idx} className="border-t">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm">
                      {String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {summary && (
          <p className="text-center text-xs mt-1 italic">{summary}</p>
        )}
      </>
    );
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-6">{title}</h3>

      {/* Tabs */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("chart")}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            activeTab === "chart"
              ? "bg-black text-white"
              : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
          }`}
        >
          Chart
        </button>

        <button
          onClick={() => setActiveTab("table")}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            activeTab === "table"
              ? "bg-black text-white"
              : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
          }`}
        >
          Table
        </button>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "chart" && (
          <div className="w-full min-h-[300px]">
            {renderedChart}
          </div>
        )}

        {activeTab === "table" && (
          <div className="w-full min-h-[300px]">
            {renderTable()}
          </div>
        )}
      </div>
    </div>
  );
}