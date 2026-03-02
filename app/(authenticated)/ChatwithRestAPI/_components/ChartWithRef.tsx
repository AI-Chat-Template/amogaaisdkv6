"use client";

import React, { forwardRef, useEffect } from "react";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";

const chartMap = {
  bar: Bar,
  line: Line,
  pie: Pie,
  doughnut: Doughnut,
};

interface ChartWithRefProps {
  type: "bar" | "line" | "pie" | "doughnut";
  data: any;
  options?: any;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const ChartWithRef = forwardRef<HTMLCanvasElement, ChartWithRefProps>(
  ({ type, data, options, onCanvasReady }, ref) => {
    const ChartComponent = chartMap[type];

    return (
      <ChartComponent
        data={data}
        options={options}
        ref={(chartInstance: any) => {
          const realCanvas =
            chartInstance?.canvas ||
            chartInstance?.ctx?.canvas ||
            chartInstance?.chart?.canvas;

          if (realCanvas && onCanvasReady) {
            onCanvasReady(realCanvas);
          }

          if (typeof ref === "function") ref(realCanvas);
          else if (ref) (ref as any).current = realCanvas;
        }}
      />
    );
  }
);

ChartWithRef.displayName = "ChartWithRef";
export default ChartWithRef;
