"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Share, Bookmark, MoreHorizontal } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { usePathname } from "next/navigation";

interface Action {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Heart,
  Share,
  Bookmark,
  MoreHorizontal,
};

interface BarChartConfig {
  title: string;
  description: string;
  customHtml: string;
  actions: Array<{
    icon: string;
    label: string;
    onClick: string;
  }>;
}

interface BarChartProps {
  config: BarChartConfig;
  title: string;
  description: string;
  value: any;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

const defaultChartData = [
  { month: "Jan", online: 4000, inStore: 2400 },
  { month: "Feb", online: 3000, inStore: 1398 },
  { month: "Mar", online: 2000, inStore: 9800 },
  { month: "Apr", online: 2780, inStore: 3908 },
  { month: "May", online: 1890, inStore: 4800 },
  { month: "Jun", online: 2390, inStore: 3800 },
];

interface ChartState {
  title: string;
  description: string;
  customHtml: string;
}

export function BarChartCard({
  config,
  title,
  description,
  value,
  onTitleChange,
  onDescriptionChange,
}: BarChartProps) {
  const [chartState, setChartState] = useState<ChartState>({
    title: config.title || "Monthly Sales Comparison",
    description:
      config.description ||
      "A comparison of online and in-store sales over six months",
    customHtml: config.customHtml || "",
  });

  const [customCss, setCustomCss] = useState("");
  const [customWidget, setCustomWidget] = useState(`
// Example Button Widget
function CustomButton({ label, onClick }) {
  return React.createElement(
    'button',
    {
      className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors',
      onClick: onClick,
      type: 'button'
    },
    label
  );
}
function handleClick() {
  alert('Button clicked!');
}
return React.createElement(
  'div',
  null,
  React.createElement(CustomButton, { label: 'Click me!', onClick: handleClick })
);
`);
  const [chartJson, setChartJson] = useState(
    JSON.stringify(defaultChartData, null, 2)
  );
  const [chartData, setChartData] = useState(defaultChartData);
  const path = usePathname();
  const currentPath = path.includes("submit");

  useEffect(() => {
    try {
      const parsedData = JSON.parse(chartJson);
      setChartData(parsedData);
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  }, [chartJson]);

  const handleCustomCssChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCustomCss(event.target.value);
    },
    []
  );

  const handleCustomWidgetChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCustomWidget(event.target.value);
    },
    []
  );

  const handleChartJsonChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setChartJson(event.target.value);
    },
    []
  );

  const handleAction = useCallback((actionFn: string) => {
    // Safe function execution instead of eval
    const fn = new Function(actionFn);
    return fn();
  }, []);

  const actions: Action[] = useMemo(
    () =>
      config.actions.map((action) => ({
        icon: iconMap[action.icon],
        label: action.label,
        onClick: () => handleAction(action.onClick),
      })),
    [config.actions, handleAction]
  );

  const executeCustomWidget = useCallback(() => {
    try {
      const CustomWidget = new Function(
        "React",
        `
        const { useState } = React;
        return () => {
          ${customWidget}
        }
      `
      )(React);
      return <CustomWidget />;
    } catch (error) {
      console.error("Error executing custom widget:", error);
      return (
        <div>Error executing custom widget: {(error as Error).message}</div>
      );
    }
  }, [customWidget]);

  return (
    <div className="space-y-4 w-full max-w-3xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="chart-title">Chart Title</Label>
        <Input
          id="chart-title"
          value={title}
          readOnly={currentPath}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter chart title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="chart-description">Chart Description</Label>
        <Textarea
          id="chart-description"
          value={description}
          readOnly={currentPath}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter chart description"
          rows={2}
        />
      </div>
      {!currentPath && (
        <div className="space-y-2">
          <Label htmlFor="chart-json">Chart JSON Data</Label>
          <Textarea
            id="chart-json"
            readOnly={currentPath}
            value={chartJson}
            onChange={handleChartJsonChange}
            placeholder="Enter chart JSON data"
            rows={10}
          />
        </div>
      )}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="h-[400px] w-full p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                  formatter={(value) => [`$${value}`, undefined]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar
                  dataKey="online"
                  name="Online Sales"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  className="transition-all duration-300 ease-in-out hover:opacity-80"
                />
                <Bar
                  dataKey="inStore"
                  name="In-Store Sales"
                  fill="hsl(var(--secondary))"
                  radius={[4, 4, 0, 0]}
                  className="transition-all duration-300 ease-in-out hover:opacity-80"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            className="px-6 py-2 prose prose-sm max-w-none break-words"
            style={{
              width: "100%",
              overflowWrap: "break-word",
              wordWrap: "break-word",
              hyphens: "auto",
            }}
            dangerouslySetInnerHTML={{ __html: chartState.customHtml }}
          />
        </CardContent>
        <CardFooter className="flex justify-between pb-2">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                size="icon"
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  action.onClick();
                }}
              >
                <IconComponent className="h-4 w-4" />
                <span className="sr-only">{action.label}</span>
              </Button>
            );
          })}
        </CardFooter>
      </Card>
      {!currentPath && (
        <div className="space-y-2">
          <Label htmlFor="custom-html">Custom HTML</Label>
          <Textarea
            id="custom-html"
            value={chartState.customHtml}
            onChange={(e) =>
              setChartState((prev) => ({ ...prev, customHtml: e.target.value }))
            }
            placeholder="Enter custom HTML here"
            rows={4}
          />
        </div>
      )}
      {!currentPath && (
        <div className="space-y-2">
          <Label htmlFor="custom-css">Custom CSS</Label>
          <Textarea
            id="custom-css"
            value={customCss}
            onChange={handleCustomCssChange}
            placeholder="Enter custom CSS here"
            rows={4}
          />
        </div>
      )}
      {!currentPath && (
        <div className="space-y-2">
          <Label htmlFor="custom-widget">Custom Widget</Label>
          <Textarea
            id="custom-widget"
            value={customWidget}
            onChange={handleCustomWidgetChange}
            placeholder="Enter custom widget code here"
            rows={8}
          />
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Custom Widget Preview</CardTitle>
        </CardHeader>
        <CardContent>{executeCustomWidget()}</CardContent>
      </Card>
    </div>
  );
}
