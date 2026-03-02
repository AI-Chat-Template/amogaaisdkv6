import { tool, type Tool, type ToolExecutionOptions } from "ai"
import { z } from "zod"
import { createChartConfig } from "./chart-helper"
import { runUserCode } from "./sandbox-runner"

interface PostgresRestConfig {
    url: string
    token: string
    schema?: string
}

interface APIResponse<T> {
    data: T[]
    total: number
    totalPages: number
    currentPage: number
    perPage: number
}

export function createInjectedAndLoggedTool(
    config: {
        name: string;
        description: string;
        inputSchema: z.ZodType<any, any, any>;
        execute: (args: any, injected?: any) => Promise<any>;
    },
    injectedParams?: any
): Tool<any, any> {
    const sdkCompatibleExecute = async (
        args: any,
        options: ToolExecutionOptions
    ): Promise<any> => {
        const toolName = config.name;
        console.log(`\n--- 🛠️ EXECUTING TOOL: ${toolName} ---`);
        console.log('   Arguments:', JSON.stringify(args, null, 2));

        try {
            const result =
                injectedParams !== undefined
                    ? await config.execute(args, injectedParams)
                    : await config.execute(args);

            console.log('   ✅ Result:', JSON.stringify(result));
            console.log(`--- ✅ TOOL ${toolName} FINISHED ---\n`);
            return result;
        } catch (error) {
            console.error(`   🔴 ERROR in tool ${toolName}:`, error);
            console.log(`--- 🔴 TOOL ${toolName} FAILED ---\n`);
            throw error;
        }
    };

    return tool({
        description: config.description,
        inputSchema: config.inputSchema,
        execute: sdkCompatibleExecute,
    });
}

export class PostgresRestAPI {
    private config: PostgresRestConfig
    private baseUrl: string

    constructor(config: PostgresRestConfig) {
        this.config = config
        const cleanUrl = config.url.replace(/\/$/, "")
        this.baseUrl = cleanUrl
    }

    async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<APIResponse<T>> {
        try {
            // Build the URL - endpoint should already include the table name
            let urlStr = endpoint.startsWith('/') ? `${this.baseUrl}${endpoint}` : `${this.baseUrl}/${endpoint}`;
            const url = new URL(urlStr);
            
            // Add query parameters
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset') {
                        url.searchParams.append(key, value.toString());
                    } else if (key.startsWith('filter.')) {
                        url.searchParams.append(key, value.toString());
                    } else {
                        url.searchParams.append(key, value.toString());
                    }
                }
            });

            console.log("Making request to:", url.toString());

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.config.token}`,
                    "Accept": "application/json"
                },
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => "Unknown error");
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            // Get total count from header or data length
            const contentRange = response.headers.get("Content-Range") || '';
            const total = contentRange ? parseInt(contentRange.split('/')[1]) : (Array.isArray(data) ? data.length : 1);
            const limit = params.limit || 20;
            const offset = params.offset || 0;
            const totalPages = Math.ceil(total / limit);
            const currentPage = Math.floor(offset / limit) + 1;

            return {
                data: Array.isArray(data) ? data : [data],
                total,
                totalPages,
                currentPage,
                perPage: limit,
            };
        } catch (error: any) {
            if (error.cause && typeof error.cause === 'object' && 'code' in error.cause) {
                const cause = error.cause as { code: string };
                if (cause.code === 'ENOTFOUND' || cause.code === 'ECONNREFUSED' || cause.code === 'ETIMEDOUT') {
                    throw new Error(`Network Error: Unable to connect to ${this.config.url}`);
                }
            }
            if (error.message.includes("fetch")) {
                throw new Error(`Network Error: A connection could not be made to ${this.config.url}`);
            }
            throw error;
        }
    }

    async getTableData(table: string, params: Record<string, any> = {}) {
        return this.makeRequest(table, params);
    }
    
    async getCardData(tableName: string, params: Record<string, any> = {}) {
        const result = await this.makeRequest(tableName, params);
        return {
            data: result.data,
            total: result.total
        };
    }
    
    async getTableMapData(tableName: string, params: Record<string, any> = {}) {
        const result = await this.makeRequest(tableName, params);
        const formattedData = result.data;
        return {
            data: formattedData,
            columns: formattedData.length > 0 ? Object.keys(formattedData[0] as object) : [],
            total: result.total
        };
    }
}

// Extract credentials from api_connection_json
export function extractPostgresRestCredentials(apiConnectionJson: any[]): PostgresRestConfig | null {
  if (!apiConnectionJson || !Array.isArray(apiConnectionJson) || apiConnectionJson.length === 0) {
    return null;
  }
  
  const validConfig = apiConnectionJson.find(item => 
    item.type === "postgresrest" && 
    item.status === "active" && 
    item.url && 
    item.token
  );
  
  if (!validConfig) {
    return null;
  }
  
  return {
    url: validConfig.url,
    token: validConfig.token,
    schema: validConfig.schema || 'public'
  };
}

export const createPostgresRestTools = (pgRestAPI: PostgresRestAPI | null) => ({
    // Query base URL to get available tables
    getEndpoint: createInjectedAndLoggedTool({
        name: "getEndpoint",
        description: "Access the API root to see available tables/endpoints. Use this to discover what tables exist.",
        inputSchema: z.object({}),
        execute: async () => {
            if (!pgRestAPI) {
                return { success: false, error: "API is not configured" };
            }
            
            try {
                // Make request to base URL to get available tables
                const result = await pgRestAPI.getTableData("");
                return {
                    success: true,
                    data: result.data,
                    total: result.total,
                    message: "Available tables/endpoints from API root"
                };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        },
    }),

    // Query any table directly
    getTableData: createInjectedAndLoggedTool({
        name: "getTableData",
        description: "Fetch data from any table in the database. Use the table name as the endpoint.",
        inputSchema: z.object({
            table: z.string().describe("Name of the table to query (e.g., 'user_catalog', 'products', 'orders')"),
            limit: z.number().optional().default(10).describe("Number of records to fetch"),
            offset: z.number().optional().default(0).describe("Offset for pagination"),
            order: z.string().optional().describe("Column to order by, e.g., 'column.desc' or 'column.asc'"),
            select: z.string().optional().describe("Columns to select, comma separated. For row count, use 'count' instead of 'count(*)'"),
            filter: z.record(z.string()).optional().describe("Filter parameters"),
        }),
        execute: async ({ table, limit, offset, order, select, filter }) => {
            if (!pgRestAPI) {
                return { success: false, error: "API is not configured" };
            }
            
            try {
                const params: Record<string, any> = { limit, offset };
                if (order) params.order = order;
                // Handle count query - use 'count' not 'count(*)'
                if (select && select.toLowerCase().includes('count')) {
                    params.select = 'count';
                } else if (select) {
                    params.select = select;
                }
                if (filter && typeof filter === 'object') {
                    Object.entries(filter).forEach(([key, value]) => {
                        params[`filter.${key}`] = value;
                    });
                }

                const result = await pgRestAPI.getTableData(table, params);
                return {
                    success: true,
                    data: result.data,
                    total: result.total,
                    totalPages: result.totalPages,
                    currentPage: result.currentPage
                };
            } catch (error: any) {
                console.error(`Error in getTableData:`, error.message);
                return { success: false, error: error.message };
            }
        },
    }),
    
    // Get data for cards
    getCardData: createInjectedAndLoggedTool({
        name: "getCardData",
        description: "Fetch data from a table for card display",
        inputSchema: z.object({
            table: z.string().describe("Name of the table"),
            limit: z.number().optional().default(10).describe("Number of records"),
            filter: z.record(z.string()).optional().describe("Filter parameters"),
            order: z.string().optional().describe("Order by column"),
        }),
        execute: async ({ table, limit, filter, order }) => {
            if (!pgRestAPI) {
                return { success: false, error: "API is not configured" };
            }
            
            try {
                const params: Record<string, any> = { limit };
                if (order) params.order = order;
                if (filter) {
                    Object.entries(filter).forEach(([key, value]) => {
                        params[`filter.${key}`] = value;
                    });
                }

                const result = await pgRestAPI.getCardData(table, params);
                return { success: true, data: result.data, total: result.total };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        },
    }),
    
    // Get data for tables
    getTableMapData: createInjectedAndLoggedTool({
        name: "getTableMapData",
        description: "Fetch data from a table for table display",
        inputSchema: z.object({
            table: z.string().describe("Name of the table"),
            limit: z.number().optional().default(20).describe("Number of records"),
            offset: z.number().optional().default(0).describe("Offset"),
            filter: z.record(z.string()).optional().describe("Filter parameters"),
            order: z.string().optional().describe("Order by column"),
            select: z.string().optional().describe("Columns to select"),
        }),
        execute: async ({ table, limit, offset, filter, order, select }) => {
            if (!pgRestAPI) {
                return { success: false, error: "API is not configured" };
            }
            
            try {
                const params: Record<string, any> = { limit, offset };
                if (order) params.order = order;
                if (select) params.select = select;
                if (filter) {
                    Object.entries(filter).forEach(([key, value]) => {
                        params[`filter.${key}`] = value;
                    });
                }

                const result = await pgRestAPI.getTableMapData(table, params);
                return { success: true, data: result.data, columns: result.columns, total: result.total };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        },
    }),

    // Visualization tools
    createTable: createInjectedAndLoggedTool({
            name: "createTable",
            description: "Creates a table for data display. A title is always required. Use this to show lists of items like orders or products. Ensure the keys in the `rows` objects match the strings provided in the `headers` array.",
            inputSchema: z.object({
                title: z.string().optional().describe("Table title, e.g., 'Recent Orders' or 'Top Products'"),
                columns: z.array(z.object({
                    key: z.string().describe("The key from the data object to use for this column (e.g., 'id', 'total', 'customer_name')."),
                    header: z.string().describe("The user-friendly display name for the column header (e.g., 'Order ID', 'Total', 'Customer Name')."),
                })).describe("An array of column definition objects. Each object must map a data key to a display header."),
                rows: z.array(z.record(z.string(), z.any())).describe("Table rows as an array of objects. Example: [{'Order ID': 123, 'Total': 99.99}, ...]"),
                summary: z.string().optional().describe("Brief summary of the table data"),
            }),
          
            execute: async ({ title, columns, rows, summary }) => {
                try {
                    return {
                        success: true,
                        tableData: { title, columns, rows, summary },
                        displayType: "table",
                        visualizationCreated: true,
                    }
                } catch (error: any) {
                    console.error(`Error in createTable tool:`, error.message);
                    return {
                        success: false,
                        error: `The 'createChart' tool failed. The data might be in an unexpected format. Error: ${error.message}`
                    }
                }
            },
        }),

    createChart: createInjectedAndLoggedTool({
           name: "createChart",
           description: "Creates a chart for data visualization. Provide raw data as an array of objects and specify which columns to use for X and Y axes. IMPORTANT: Use the exact parameter names: title, type, chartData, xAxisColumn, yAxisColumn.",
           // CORRECT SYNTAX: z.preprocess(transformer, schema)
           inputSchema: z.preprocess(
               // 1. The transformer function to clean the raw input
               (arg: unknown) => {
                   if (typeof arg !== 'object' || arg === null) return arg;
                   const input = arg as any;
   
                   // Handle alias for 'type'
                   if ('chart_type' in input && !('type' in input)) {
                       input.type = input.chart_type;
                       delete input.chart_type;
                   }
                   // Handle alias for 'chartData'
                   if ('chart_data' in input && !('chartData' in input)) {
                       input.chartData = input.chart_data;
                       delete input.chart_data;
                   }
                   // Handle alias for 'xAxisColumn'
                   if ('x_axis_column' in input && !('xAxisColumn' in input)) {
                       input.xAxisColumn = input.x_axis_column;
                       delete input.x_axis_column;
                   }
                   // Handle alias for 'yAxisColumn'
                   if ('y_axis_column' in input && !('yAxisColumn' in input)) {
                       input.yAxisColumn = input.y_axis_column;
                       delete input.y_axis_column;
                   }
                   return input;
               },
               // 2. The final Zod schema the cleaned input must match
               z.object({
                   title: z.string().describe("The title of the chart."),
                   type: z.enum(["line", "bar", "pie", "doughnut", "radar", "polarArea"]).describe("The type of chart to create."),
                   chartData: z.array(z.record(z.string(), z.any())).describe("The array of data objects to be plotted."),
                   xAxisColumn: z.string().describe("The key in chartData objects for the X-axis labels."),
                   yAxisColumn: z.string().describe("The key in chartData objects for the Y-axis data."),
                   datasetLabel: z.string().optional().default("Data").describe("The label for the dataset."),
               })
           ),
           execute: async ({ type, title, chartData, xAxisColumn, yAxisColumn, datasetLabel }) => {
               try {
                   // const labelsArray = chartData.map((item: any) => item[xAxisColumn]);
                   // Truncate X-axis labels to 25 characters for readability
                   const labelsArray = chartData.map((item: any) => {
                       const label = item[xAxisColumn];
                       return typeof label === 'string' ? label.slice(0, 25) : label;
                   });
                   const dataArray = chartData.map((item: any) => parseFloat(item[yAxisColumn])).filter((n: any) => !isNaN(n));
   
                   const config = createChartConfig({
                       type,
                       title,
                       data: {
                           labels: labelsArray,
                           datasets: [{
                               label: datasetLabel || yAxisColumn,
                               data: dataArray,
                           }],
                       },
                   });
   
                   return {
                       success: true,
                       chartConfig: config,
                       displayType: "chart",
                       visualizationCreated: true,
                   };
               } catch (error: any) {
                   console.error(`Error in createChart tool:`, error.message);
                   return {
                       success: false,
                       error: `The 'createChart' tool failed. The data might be in an unexpected format. Error: ${error.message}`
                   }
               }
           },
       }),
createCard: createInjectedAndLoggedTool({
  name: "createCard",
  description: "Creates a KPI card for displaying a single value such as total revenue, total records, or total customers.",
  inputSchema: z.object({
    title: z.string().describe("The label/header of the card (e.g. 'Total Revenue', 'Total Orders')."),
    value: z.string().describe("The main value to display."),
    prefix: z.string().optional().describe("Optional prefix like '$'."),
    suffix: z.string().optional().describe("Optional suffix like 'orders', 'customers'."),
    description: z.string().optional().describe("Optional context like 'This month' or 'Last 30 days'."),
  }),
  execute: async ({ title, value, prefix, suffix, description }) => {
    return {
      success: true,
      displayType: "card",
      visualizationCreated: true,
      cardData: {
        title,
        value, // already string
        prefix,
        suffix,
        description,
      },
    };
  },
    }),

    runCode: createInjectedAndLoggedTool({
        name: "runCode",
        description: "Run JavaScript code to process data",
        inputSchema: z.object({
            code: z.string().describe("JavaScript code to run"),
            data: z.any().optional().describe("Data to process"),
        }),
        execute: async ({ code, data }) => {
            try {
                const result = await runUserCode(code, data);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        }
    }),

    // Get limited records (5 or 10) from a table
    getRecords: createInjectedAndLoggedTool({
        name: "getRecords",
        description: "Fetch a limited number of records (5 or 10) from a specific table. Use this for quick data preview. Do NOT use order parameter unless user explicitly requests sorting.",
        inputSchema: z.object({
            table: z.string().describe("Name of the table to query (e.g., 'user_catalog', 'products', 'orders')"),
            limit: z.union([z.literal(5), z.literal(10)]).describe("Number of records to fetch: 5 or 10"),
            order: z.string().optional().describe("Column to order by - ONLY use if user explicitly requests sorting and provides column name"),
            select: z.string().optional().describe("Columns to select, comma separated"),
            filter: z.record(z.string()).optional().describe("Filter parameters"),
        }),
        execute: async ({ table, limit, order, select, filter }) => {
            if (!pgRestAPI) {
                return { success: false, error: "API is not configured" };
            }
            
            try {
                const params: Record<string, any> = { limit, offset: 0 };
                // Only add order if explicitly provided
                if (order) params.order = order;
                if (select) params.select = select;
                if (filter && typeof filter === 'object') {
                    Object.entries(filter).forEach(([key, value]) => {
                        params[`filter.${key}`] = value;
                    });
                }

                const result = await pgRestAPI.getTableData(table, params);
                return {
                    success: true,
                    data: result.data,
                    total: result.total,
                    message: `Retrieved ${result.data.length} records from ${table}`
                };
            } catch (error: any) {
                console.error(`Error in getRecords:`, error.message);
                return { success: false, error: error.message };
            }
        },
    })
});
