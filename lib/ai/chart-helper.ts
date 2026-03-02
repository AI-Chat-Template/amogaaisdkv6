export interface ChartConfig {
  type: "line" | "bar" | "pie" | "doughnut" | "radar" | "polarArea"
  title?: string
  data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string | string[]
      borderWidth?: number
      fill?: boolean
      tension?: number
    }>
  }
  options?: any
}

export function createChartConfig(config: ChartConfig): ChartConfig {
  // Set default colors if not provided
  const defaultColors = [
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#feca57",
    "#ff9ff3",
    "#54a0ff",
    "#5f27cd",
    "#00d2d3",
    "#ff9f43",
    "#ee5a24",
  ]

  const processedConfig = {
    ...config,
    data: {
      ...config.data,
      datasets: config.data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor:
          dataset.backgroundColor ||
          (config.type === "pie" || config.type === "doughnut"
            ? defaultColors.slice(0, config.data.labels.length)
            : `${defaultColors[index % defaultColors.length]}33`),
        borderColor: dataset.borderColor || defaultColors[index % defaultColors.length],
        borderWidth: dataset.borderWidth || 2,
        fill: dataset.fill !== undefined ? dataset.fill : config.type === "line" ? false : true,
        tension: dataset.tension || (config.type === "line" ? 0.4 : 0),
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
        },
        title: {
          display: !!config.title,
          text: config.title,
        },
      },
      scales:
        config.type === "pie" || config.type === "doughnut"
          ? undefined
          : {
              y: {
                beginAtZero: true,
                title: { display: true, text: "Value" },
              },
              x: {
                title: { display: true, text: "Category" },
              },
            },
      ...config.options,
    },
  }

  return processedConfig
}

// Helper function for the AI to create common chart types
export const chartTemplates = {
  salesTrend: (labels: string[], data: number[], title = "Sales Trend") => ({
    type: "line" as const,
    title,
    data: {
      labels,
      datasets: [
        {
          label: "Sales ($)",
          data,
          fill: true,
        },
      ],
    },
  }),

  productComparison: (labels: string[], data: number[], title = "Product Comparison") => ({
    type: "bar" as const,
    title,
    data: {
      labels,
      datasets: [
        {
          label: "Quantity/Revenue",
          data,
        },
      ],
    },
  }),

  categoryDistribution: (labels: string[], data: number[], title = "Category Distribution") => ({
    type: "doughnut" as const,
    title,
    data: {
      labels,
      datasets: [
        {
          label: "Distribution",
          data,
        },
      ],
    },
  }),
}
