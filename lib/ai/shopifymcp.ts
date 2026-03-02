import { tool, type Tool, type ToolExecutionOptions } from "ai"
import { z } from "zod"
import { createChartConfig } from "./chart-helper"
import { runUserCode } from "./sandbox-runner"

// ===============================
// SHOPIFY ADMIN API CLIENT (GraphQL)
// ===============================

interface ShopifyConfig {
    shop_subdomain: string;
    access_token: string;
    app_secret_key?: string;
}

export class ShopifyAdminAPI {
    private shop: string;
    private accessToken: string;
    private baseUrl: string;

    constructor(config: ShopifyConfig) {
        this.shop = config.shop_subdomain;
        this.accessToken = config.access_token;
        this.baseUrl = `https://${this.shop}.myshopify.com/admin/api/2024-01`;
    }

    private async graphqlRequest<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}/graphql.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": this.accessToken,
            },
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Shopify API Error: ${response.status} - ${errorText}`);
        }

        const json = await response.json();

        if (json.errors) {
            throw new Error(`Shopify GraphQL Error: ${JSON.stringify(json.errors)}`);
        }

        return json.data;
    }

    async testConnection(): Promise<boolean> {
        try {
            const query = `
                query {
                    shop {
                        name
                    }
                }
            `;
            await this.graphqlRequest(query);
            return true;
        } catch (error) {
            throw new Error(`Shopify connection test failed: ${(error as any).message}`);
        }
    }

    async getProducts(params: { first?: number; after?: string; query?: string } = {}) {
        const { first = 50, after, query } = params;
        
        const queryString = `
            query GetProducts($first: Int!, $after: String, $query: String) {
                products(first: $first, after: $after, query: $query) {
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    edges {
                        node {
                            id
                            title
                            handle
                            description
                            productType
                            vendor
                            status
                            createdAt
                            updatedAt
                            totalInventory
                            priceRangeV2 {
                                minVariantPrice {
                                    amount
                                    currencyCode
                                }
                                maxVariantPrice {
                                    amount
                                    currencyCode
                                }
                            }
                            images(first: 1) {
                                edges {
                                    node {
                                        url
                                        altText
                                    }
                                }
                            }
                            variants(first: 10) {
                                edges {
                                    node {
                                        id
                                        title
                                        price {
                                            amount
                                            currencyCode
                                        }
                                        sku
                                        inventoryQuantity
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await this.graphqlRequest(queryString, { first, after, query });
        return (result as any).products;
    }

    async getOrders(params: { first?: number; after?: string; query?: string } = {}) {
        const { first = 50, after, query } = params;



        const queryString = `
            query GetOrders($first: Int!, $after: String, $query: String) {
                orders(first: $first, after: $after, query: $query) {
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    edges {
                        node {
                            id
                            name
                            createdAt
                            updatedAt
                            displayFinancialStatus
                            displayFulfillmentStatus
                            totalPriceSet {
                                shopMoney {
                                    amount
                                    currencyCode
                                }
                            }
                            subtotalPriceSet {
                                shopMoney {
                                    amount
                                    currencyCode
                                }
                            }
                            totalTaxSet {
                                shopMoney {
                                    amount
                                    currencyCode
                                }
                            }
                            totalShippingPriceSet {
                                shopMoney {
                                    amount
                                    currencyCode
                                }
                            }
                            totalDiscountsSet {
                                shopMoney {
                                    amount
                                    currencyCode
                                }
                            }
                            customer {
                                id
                                firstName
                                lastName
                                email
                                phone
                            }
                            billingAddress {
                                firstName
                                lastName
                                company
                                address1
                                address2
                                city
                                province
                                country
                                zip
                            }
                            shippingAddress {
                                firstName
                                lastName
                                company
                                address1
                                address2
                                city
                                province
                                country
                                zip
                            }
                            lineItems(first: 50) {
                                edges {
                                    node {
                                        id
                                        title
                                        quantity
                                        originalUnitPriceSet {
                                            shopMoney {
                                                amount
                                                currencyCode
                                            }
                                        }
                                        totalDiscountSet {
                                            shopMoney {
                                                amount
                                                currencyCode
                                            }
                                        }
                                        product {
                                            id
                                            title
                                        }
                                        variant {
                                            id
                                            title
                                            sku
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await this.graphqlRequest(queryString, { first, after, query });
        return (result as any).orders;
    }

    async getCustomers(params: { first?: number; after?: string; query?: string } = {}) {
        const { first = 50, after, query } = params;

        const queryString = `
            query GetCustomers($first: Int!, $after: String, $query: String) {
                customers(first: $first, after: $after, query: $query) {
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    edges {
                        node {
                            id
                            firstName
                            lastName
                            email
                            phone
                            createdAt
                            updatedAt
                            note
                            displayName
                            defaultAddress {
                                firstName
                                lastName
                                company
                                address1
                                address2
                                city
                                province
                                country
                                zip
                                phone
                            }
                        }
                    }
                }
            }
        `;

        const result = await this.graphqlRequest(queryString, { first, after, query });
        return (result as any).customers;
    }

    async getStoreOverview(period: 'week' | 'month' | 'last_month' | 'year' = 'month') {
        // Calculate date range
        const now = new Date();
        let startDate: string;
        
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1).toISOString();
                break;
        }

        const query = `created_at:>${startDate}`;

        // Fetch orders for the period
        const ordersData = await this.getOrders({ first: 250, query });
        const orders = ordersData.edges.map((edge: any) => edge.node);

        // Calculate metrics
        const totalRevenue = orders.reduce((sum: number, order: any) => {
            return sum + parseFloat(order.totalPriceSet?.shopMoney?.amount || '0');
        }, 0);

        // Get all customers
        const allCustomers = await this.getCustomers({ first: 250 });
        const totalCustomers = allCustomers.edges.length.toString();

        // Get all products
        const allProducts = await this.getProducts({ first: 250 });
        const totalProducts = allProducts.edges.length.toString();

        // Calculate top products
        const productCounts: Record<string, number> = {};
        orders.forEach((order: any) => {
            order.lineItems?.edges?.forEach((item: any) => {
                const title = item.node.title;
                productCounts[title] = (productCounts[title] || 0) + item.node.quantity;
            });
        });

        const topSellingProducts = Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, quantity]) => ({ name, quantity }));

        // Calculate unique customers from orders
        const uniqueCustomerIds = new Set();
        orders.forEach((order: any) => {
            if (order.customer && order.customer.id) {
                uniqueCustomerIds.add(order.customer.id);
            }
        });

        return {
            period,
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            totalOrders: orders.length,
            totalNewCustomers: uniqueCustomerIds.size,
            averageOrderValue: orders.length > 0 ? parseFloat((totalRevenue / orders.length).toFixed(2)) : 0,
            topSellingProducts,
            totalProductsInStore: allProducts.edges.length,
            totalCustomersInStore: allCustomers.edges.length,
        };
    }

    async getInventoryLevels(params: { locationId?: string } = {}) {
        const queryString = `
            query GetInventoryLevels($first: Int!) {
                inventoryItems(first: $first) {
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    edges {
                        node {
                            id
                            sku
                            variant {
                                id
                                title
                                product {
                                    id
                                    title
                                }
                            }
                            inventoryLevels(first: 10) {
                                edges {
                                    node {
                                        id
                                        available
                                        location {
                                            id
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await this.graphqlRequest(queryString, { first: 50 });
        return (result as any).inventoryItems;
    }

    async getLocations() {
        const queryString = `
            query GetLocations {
                locations(first: 50) {
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    edges {
                        node {
                            id
                            name
                            address {
                                address1
                                address2
                                city
                                province
                                country
                                zip
                            }
                        }
                    }
                }
            }
        `;

        const result = await this.graphqlRequest(queryString);
        return (result as any).locations;
    }
}

// ===============================
// TOOL HELPER
// ===============================

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

// ===============================
// SHOPIFY TOOLS EXPORT
// ===============================

export const createShopifyTools = (shopifyAPI: ShopifyAdminAPI | null) => ({
    getProducts: createInjectedAndLoggedTool({
        name: "getProducts",
        description: "Fetch products from Shopify store using GraphQL Admin API",
        inputSchema: z.object({
            first: z.number().optional().default(20).describe("Number of products to fetch (max 50)"),
            after: z.string().optional().describe("Cursor for pagination"),
            query: z.string().optional().describe("Search query to filter products"),
        }),
        execute: async ({ first, after, query }) => {
            if (!shopifyAPI) {
                return {
                    success: false,
                    error: "Shopify API is not configured. Please guide the user to the settings page.",
                };
            }

            try {
                const result = await shopifyAPI.getProducts({ first, after, query });
                
                const products = result.edges.map((edge: any) => {
                    const product = edge.node;
                    return {
                        id: product.id,
                        title: product.title,
                        handle: product.handle,
                        description: product.description,
                        productType: product.productType,
                        vendor: product.vendor,
                        status: product.status,
                        createdAt: product.createdAt,
                        totalInventory: product.totalInventory,
                        price: product.priceRangeV2?.minVariantPrice?.amount,
                        currency: product.priceRangeV2?.minVariantPrice?.currencyCode,
                        image: product.images?.edges?.[0]?.node?.url,
                        variants: product.variants?.edges?.map((v: any) => ({
                            id: v.node.id,
                            title: v.node.title,
                            price: v.node.price?.amount,
                            sku: v.node.sku,
                            inventory: v.node.inventoryQuantity,
                        })),
                    };
                });

                return {
                    success: true,
                    data: products,
                    pageInfo: result.pageInfo,
                };
            } catch (error: any) {
                console.error("Error in getProducts tool:", error.message);
                return {
                    success: false,
                    error: `The 'getProducts' tool failed. Reason: ${error.message}. Please check your connection and parameters.`,
                };
            }
        },
    }),

getOrders: createInjectedAndLoggedTool({
  name: "getOrders",
  description:
    "Fetch orders from Shopify. Supports count, status filtering (paid, pending, refunded), and top N by amount (max 10).",

  inputSchema: z.object({
    first: z.number().optional().default(20),
    after: z.string().optional(),
    query: z.string().optional(),
    financialStatus: z.enum([
      "paid",
      "pending",
      "refunded",
      "partially_refunded",
      "any",
    ]).optional().default("any"),
    top: z.number().optional(), // Top N by amount
    countOnly: z.boolean().optional().default(false),
  }),

  execute: async ({
    first,
    after,
    query,
    financialStatus,
    top,
    countOnly,
  }) => {
    if (!shopifyAPI) {
      return {
        success: false,
        error: "Shopify API is not configured.",
      };
    }

    try {
      // 🔹 Build financial status filter
      const statusFilter =
        financialStatus && financialStatus !== "any"
          ? `financial_status:${financialStatus}`
          : "";

      const finalQuery =
        [query, statusFilter].filter(Boolean).join(" ");

      // ✅ COUNT MODE
      if (countOnly) {
        const COUNT_QUERY = `
          query OrdersCount($query: String) {
            ordersCount(query: $query) {
              count
            }
          }
        `;

        const result: any = await (shopifyAPI as any).graphqlRequest(
          COUNT_QUERY,
          { query: finalQuery }
        );

        return {
          success: true,
          total_orders: result.ordersCount.count,
        };
      }

      // 🔒 Enforce Top Limit
      const MAX_TOP = 10;
      let finalTop = top && top > 0 ? Math.min(top, MAX_TOP) : null;

      const FETCH_LIMIT = finalTop ? 250 : first;

      const QUERY = `
        query GetOrders(
          $first: Int!,
          $after: String,
          $query: String
        ) {
          orders(
            first: $first,
            after: $after,
            query: $query,
            sortKey: TOTAL_PRICE,
            reverse: true
          ) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                name
                createdAt
                displayFinancialStatus
                displayFulfillmentStatus
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                customer {
                  firstName
                  lastName
                  email
                }
              }
            }
          }
        }
      `;

      const result: any = await (shopifyAPI as any).graphqlRequest(
        QUERY,
        {
          first: FETCH_LIMIT,
          after,
          query: finalQuery,
        }
      );

      let orders = result.orders.edges.map((e: any) => e.node);

      // ✅ Top Mode
      if (finalTop) {
        orders = orders.slice(0, finalTop);
      }

      return {
        success: true,
        restricted_to_max_10: top && top > MAX_TOP ? true : false,
        data: orders.map((o: any) => ({
          id: o.id,
          order_number: o.name,
          date: o.createdAt,
          financial_status: o.displayFinancialStatus,
          fulfillment_status: o.displayFulfillmentStatus,
          total_amount:
            o.totalPriceSet.shopMoney.amount +
            " " +
            o.totalPriceSet.shopMoney.currencyCode,
          customer: o.customer
            ? `${o.customer.firstName ?? ""} ${o.customer.lastName ?? ""}`.trim()
            : "Guest",
        })),
        pageInfo: result.orders.pageInfo,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
}),

    getCustomers: createInjectedAndLoggedTool({
  name: "getCustomers",
  description:
    "Fetch customers from Shopify. Supports count and top customers by total spent (max 10).",

  inputSchema: z.object({
    first: z.number().optional().default(20),
    after: z.string().optional(),
    query: z.string().optional(),
    top: z.number().optional(), // user requested top N
    countOnly: z.boolean().optional().default(false),
  }),

  execute: async ({ first, after, query, top, countOnly }) => {
    if (!shopifyAPI) {
      return {
        success: false,
        error: "Shopify API is not configured.",
      };
    }

    try {
      // ✅ COUNT MODE
      if (countOnly) {
        const COUNT_QUERY = `
          query CustomersCount($query: String) {
            customersCount(query: $query) {
              count
            }
          }
        `;

        const result: any = await (shopifyAPI as any).graphqlRequest(
          COUNT_QUERY,
          { query }
        );

        return {
          success: true,
          total_customers: result.customersCount.count,
        };
      }

      // 🔒 ENFORCE MAX LIMIT (IMPORTANT)
      const MAX_TOP = 10;
      let finalTop = top && top > 0 ? Math.min(top, MAX_TOP) : null;

      // Always fetch enough customers for ranking
      const FETCH_LIMIT = finalTop ? 250 : first;

      const QUERY = `
        query GetCustomers(
          $first: Int!,
          $after: String,
          $query: String
        ) {
          customers(
            first: $first,
            after: $after,
            query: $query,
            sortKey: CREATED_AT,
            reverse: true
          ) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                firstName
                lastName
                displayName
                email
                phone
                createdAt
                numberOfOrders
                amountSpent {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      `;

      const result: any = await (shopifyAPI as any).graphqlRequest(
        QUERY,
        { first: FETCH_LIMIT, after, query }
      );

      let customers = result.customers.edges.map((e: any) => e.node);

      // ✅ TOP MODE (Manual Sort)
      if (finalTop) {
        customers = customers
          .sort(
            (a: any, b: any) =>
              parseFloat(b.amountSpent?.amount || "0") -
              parseFloat(a.amountSpent?.amount || "0")
          )
          .slice(0, finalTop);
      }

      return {
        success: true,
        restricted_to_max_10: top && top > MAX_TOP ? true : false,
        data: customers.map((c: any) => ({
          id: c.id,
          name:
            c.displayName ??
            `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim(),
          email: c.email,
          phone: c.phone,
          created_at: c.createdAt,
          total_orders: c.numberOfOrders,
          total_spent:
            (c.amountSpent?.amount || "0") +
            " " +
            (c.amountSpent?.currencyCode || ""),
        })),
        pageInfo: result.customers.pageInfo,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
}),
    getStoreOverview: createInjectedAndLoggedTool({
        name: "getStoreOverview",
        description: "Provides a comprehensive overview of the Shopify store's performance for a given period.",
        inputSchema: z.object({
            period: z.enum(['week', 'month', 'last_month', 'year'])
                .optional()
                .default('month')
                .describe("The time period for the overview")
        }),
        execute: async ({ period }) => {
            if (!shopifyAPI) {
                return {
                    success: false,
                    error: "Shopify API is not configured. Please guide the user to the settings page.",
                };
            }

            try {
                const overview = await shopifyAPI.getStoreOverview(period);
                return {
                    success: true,
                    ...overview
                };
            } catch (error: any) {
                console.error("Error in getStoreOverview tool:", error.message);
                return {
                    success: false,
                    error: `Tool execution failed. Reason: ${error.message}`,
                };
            }
        },
    }),

    getLocations: createInjectedAndLoggedTool({
        name: "getLocations",
        description: "Fetch all inventory locations from Shopify store",
        inputSchema: z.object({}),
        execute: async () => {
            if (!shopifyAPI) {
                return {
                    success: false,
                    error: "Shopify API is not configured. Please guide the user to the settings page.",
                };
            }

            try {
                const result = await shopifyAPI.getLocations();
                const locations = result.edges.map((edge: any) => edge.node);
                return {
                    success: true,
                    data: locations,
                };
            } catch (error: any) {
                console.error("Error in getLocations tool:", error.message);
                return {
                    success: false,
                    error: `The 'getLocations' tool failed. Reason: ${error.message}.`,
                };
            }
        },
    }),

    getInventory: createInjectedAndLoggedTool({
        name: "getInventory",
        description: "Fetch inventory levels for products in Shopify store",
        inputSchema: z.object({
            locationId: z.string().optional().describe("Specific location ID to get inventory for"),
        }),
        execute: async ({ locationId }) => {
            if (!shopifyAPI) {
                return {
                    success: false,
                    error: "Shopify API is not configured. Please guide the user to the settings page.",
                };
            }

            try {
                const result = await shopifyAPI.getInventoryLevels({ locationId });
                const inventory = result.edges.map((edge: any) => {
                    const item = edge.node;
                    return {
                        id: item.id,
                        sku: item.sku,
                        productTitle: item.variant?.product?.title,
                        variantTitle: item.variant?.title,
                        levels: item.inventoryLevels?.edges?.map((level: any) => ({
                            location: level.node.location?.name,
                            available: level.node.available,
                        })),
                    };
                });
                return {
                    success: true,
                    data: inventory,
                };
            } catch (error: any) {
                console.error("Error in getInventory tool:", error.message);
                return {
                    success: false,
                    error: `The 'getInventory' tool failed. Reason: ${error.message}.`,
                };
            }
        },
    }),

    createCard: createInjectedAndLoggedTool({
        name: "createCard",
        description: "Creates a KPI card for displaying a single value such as total revenue, total orders, or total customers.",
        inputSchema: z.object({
            title: z.string().describe("The label/header of the card"),
            value: z.string().describe("The main value to display"),
            prefix: z.string().optional().describe("Optional prefix like '$'"),
            suffix: z.string().optional().describe("Optional suffix"),
            description: z.string().optional().describe("Optional context"),
        }),
        execute: async ({ title, value, prefix, suffix, description }) => {
            return {
                success: true,
                displayType: "card",
                visualizationCreated: true,
                cardData: { title, value, prefix, suffix, description },
            };
        },
    }),

    createChart: createInjectedAndLoggedTool({
        name: "createChart",
        description: "Creates a chart for data visualization. Provide raw data as an array of objects and specify which columns to use for X and Y axes. IMPORTANT: Use the exact parameter names: title, type, chartData, xAxisColumn, yAxisColumn.",
        inputSchema: z.preprocess(
            (arg: unknown) => {
                if (typeof arg !== 'object' || arg === null) return arg;
                const input = arg as any;
                if ('chart_type' in input && !('type' in input)) {
                    input.type = input.chart_type;
                    delete input.chart_type;
                }
                if ('chart_data' in input && !('chartData' in input)) {
                    input.chartData = input.chart_data;
                    delete input.chart_data;
                }
                if ('x_axis_column' in input && !('xAxisColumn' in input)) {
                    input.xAxisColumn = input.x_axis_column;
                    delete input.x_axis_column;
                }
                if ('y_axis_column' in input && !('yAxisColumn' in input)) {
                    input.yAxisColumn = input.y_axis_column;
                    delete input.y_axis_column;
                }
                return input;
            },
            z.object({
                title: z.string().describe("The title of the chart"),
                type: z.enum(["line", "bar", "pie", "doughnut", "radar", "polarArea"]).describe("The type of chart"),
                chartData: z.array(z.record(z.string(), z.any())).describe("The array of data objects"),
                xAxisColumn: z.string().describe("The key for X-axis labels"),
                yAxisColumn: z.string().describe("The key for Y-axis data"),
                datasetLabel: z.string().optional().default("Data").describe("Dataset label"),
            })
        ),
        execute: async ({ type, title, chartData, xAxisColumn, yAxisColumn, datasetLabel }) => {
            try {
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
                return {
                    success: false,
                    error: `The 'createChart' tool failed. Error: ${error.message}`,
                };
            }
        },
    }),

    createTable: createInjectedAndLoggedTool({
        name: "createTable",
        description: "Creates a table for data display. A title is always required. Use this to show lists of items like orders or products.",
        inputSchema: z.object({
            title: z.string().optional().describe("Table title"),
            columns: z.array(z.object({
                key: z.string().describe("The key from the data object"),
                header: z.string().describe("The display name for the column"),
            })).describe("Column definitions"),
            rows: z.array(z.record(z.string(), z.any())).describe("Table rows"),
            summary: z.string().optional().describe("Brief summary"),
        }),
        execute: async ({ title, columns, rows, summary }) => {
            try {
                return {
                    success: true,
                    tableData: { title, columns, rows, summary },
                    displayType: "table",
                    visualizationCreated: true,
                };
            } catch (error: any) {
                return {
                    success: false,
                    error: `The 'createTable' tool failed. Error: ${error.message}`,
                };
            }
        },
    }),

    codeInterpreter: createInjectedAndLoggedTool({
        name: 'codeInterpreter',
        description: `Executes sandboxed JavaScript for complex analysis. Available helpers:
- fetch(entity, params) - fetch products, orders, or customers from Shopify
- Basic math: multiply, add, subtract, divide
- Array helpers: sum, average, max, min, sortBy
- Data helpers: groupBy
- Date helpers: formatDate, daysBetween`,
        inputSchema: z.object({ code: z.string() }),
        execute: async ({ code }) => {
            const shopifyHelpers = {
                fetch: async (entity: 'products' | 'orders' | 'customers', params: { first?: number; query?: string } = {}) => {
                    const { first = 50, query } = params;
                    try {
                        if (entity === 'products') {
                            const result = await shopifyAPI!.getProducts({ first, query });
                            return result.edges.map((e: any) => e.node);
                        } else if (entity === 'orders') {
                            const result = await shopifyAPI!.getOrders({ first, query });
                            return result.edges.map((e: any) => e.node);
                        } else if (entity === 'customers') {
                            const result = await shopifyAPI!.getCustomers({ first, query });
                            return result.edges.map((e: any) => e.node);
                        }
                    } catch (error) {
                        console.error("codeInterpreter fetch error:", error);
                        throw error;
                    }
                },
            };

            try {
                const result = await runUserCode(code, shopifyHelpers);
                return result;
            } catch (error: any) {
                return {
                    success: false,
                    error: "Execution failed",
                    message: error.message,
                };
            }
        },
    }),

    createMap: createInjectedAndLoggedTool({
        name: "createMap",
        description: `Creates a map visualization grouped by location.
Orders/customers with the SAME latitude and longitude are automatically grouped into ONE marker.

Use when the user asks:
- "map of orders"
- "orders by zip"
- "show orders on map"
- "customer orders location"`,
        inputSchema: z.object({
            title: z.string().optional().describe("Map title"),
            entityType: z.enum(["orders", "customers"]).describe("What is being shown on the map"),
            points: z.array(z.object({
                label: z.string().describe("Location label"),
                lat: z.number().describe("Latitude"),
                lng: z.number().describe("Longitude"),
                ids: z.array(z.number()).describe("Order or Customer IDs"),
            })).describe("Location points"),
        }),
        execute: async ({ title, entityType, points }) => {
            const grouped: Record<string, { label: string; lat: number; lng: number; ids: number[] }> = {};

            for (const p of points) {
                const key = `${p.lat},${p.lng}`;
                if (!grouped[key]) {
                    grouped[key] = { label: p.label, lat: p.lat, lng: p.lng, ids: [] };
                }
                grouped[key].ids.push(...p.ids);
            }

            const normalizedPoints = Object.values(grouped).map((p) => ({
                label: p.label,
                lat: p.lat,
                lng: p.lng,
                value: p.ids.length,
                orderIds: entityType === "orders" ? p.ids : undefined,
                customerIds: entityType === "customers" ? p.ids : undefined,
            }));

            return {
                success: true,
                visualizationCreated: true,
                displayType: "map",
                mapData: {
                    title: title || (entityType === "orders" ? "Orders by Location" : "Customers by Location"),
                    entityType,
                    points: normalizedPoints,
                },
            };
        },
    }),
});
