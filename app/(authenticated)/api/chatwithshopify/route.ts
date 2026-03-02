"use server";

import { streamText, UIMessage, convertToModelMessages, stepCountIs, consumeStream } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createShopifyTools, ShopifyAdminAPI } from "@/lib/ai/shopifymcp";
import { auth } from "@/auth";
import { postgrest } from "@/lib/postgrest";
import { v4 as uuidv4 } from "uuid";
import {
  saveMessageTokenUsage,
  updateChatTotals,
  saveAssistantMessage,
  saveUserMessage
} from "@/app/(authenticated)/chatwithshopify/actions";

async function selectModel(aiSettings: any) {
  const provider = aiSettings?.provider;
  const providerKey = aiSettings?.providerKey;
  const modelId = aiSettings?.model;

  if (!provider || !providerKey) {
    throw new Error("AI provider or API key missing.");
  }

  switch (provider.toLowerCase()) {
    case "google":
    case "gemini": {
      const google = createGoogleGenerativeAI({ apiKey: providerKey });
      return google(modelId || "gemini-2.0-flash");
    }
    case "openai": {
      const openai = createOpenAI({ apiKey: providerKey });
      return openai(modelId || "gpt-4o-mini");
    }
    case "openrouter": {
      const openrouter = createOpenRouter({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: providerKey,
      });
      return openrouter(modelId || "google/gemini-flash-1.5");
    }
    case "anthropic": {
      const anthropic = createOpenAI({
        baseURL: "https://api.anthropic.com",
        apiKey: providerKey,
      });
      return anthropic(modelId || "claude-2");
    }
    case "mistral": {
      const mistral = createOpenAI({
        baseURL: "https://api.mistral.ai/v1",
        apiKey: providerKey,
      });
      return mistral(modelId || "mistral-large-latest");
    }
    case "deepseek": {
      const deepseek = createOpenAI({
        baseURL: "https://api.deepseek.ai",
        apiKey: providerKey,
      });
      return deepseek(modelId || "deepseek-v1");
    }
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// =====================================================
// SIMPLE TOKEN COST CALCULATOR
// =====================================================
function calculateCost({
  promptTokens,
  completionTokens,
}: {
  promptTokens: number;
  completionTokens: number;
}) {
  const INPUT_RATE = 0.000002;
  const OUTPUT_RATE = 0.000004;

  const cost =
    promptTokens * INPUT_RATE +
    completionTokens * OUTPUT_RATE;

  return Number(cost.toFixed(6));
}

function extractStoryText(content: any): string {
  if (!content) return "";

  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content.map((c: any) => c?.text ?? "").join("").trim();
  }

  if (typeof content === "object" && content !== null) {
    if (typeof content.text === "string") return content.text;
    if (Array.isArray((content as any).parts)) {
      return (content as any).parts.map((p: any) => p.text ?? "").join("").trim();
    }
  }

  return "";
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();
    const userId = session?.user?.user_catalog_id;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    // 2. Parse incoming request JSON
    const body = await req.json();
    const { messages, chatUuid }: { messages: UIMessage[]; chatUuid: string } = body;

    if (!chatUuid) {
      return new Response("Missing chatUuid", { status: 400 });
    }

    // 3. Fetch user configurations for AI and API connections
    const { data, error } = await postgrest
      .from("user_catalog" as any)
      .select("aiapi_connection_json, api_connection_json")
      .eq("user_catalog_id", userId)
      .single();

    if (error || !data) {
      return new Response("Failed to load user configuration", { status: 500 });
    }

    // 4. Select AI provider
    const aiList = Array.isArray(data.aiapi_connection_json)
      ? data.aiapi_connection_json
      : [data.aiapi_connection_json];
    const defaultAI = aiList.find((a: any) => a.default === true) || aiList[0] || {};

    const aiSettings = {
      provider: defaultAI.provider,
      providerKey: defaultAI.key,
      model: defaultAI.model,
    };

    // 5. Shopify settings interface
    interface ShopifySettings {
      shop_subdomain?: string;
      access_token?: string;
      app_secret_key?: string;
      platform_type?: string;
      status?: string;
    }

    let shopifySettings: ShopifySettings = {};

    if (Array.isArray(data.api_connection_json)) {
     const shopifyConfig = data.api_connection_json.find(
  (api: any) => api.apiname === "shopify" && api.status === "active"
);
      if (shopifyConfig) {
        shopifySettings = shopifyConfig as ShopifySettings;
      }
    } else {
      const apiData = data.api_connection_json as any;
      if (apiData?.apiname === "shopify") {
        shopifySettings = apiData as ShopifySettings;
      }
    }

    // 6. Initialize Shopify API
    let shopifyAPI: ShopifyAdminAPI | null = null;

    if (shopifySettings.shop_subdomain && shopifySettings.access_token) {
      shopifyAPI = new ShopifyAdminAPI({
        shop_subdomain: shopifySettings.shop_subdomain,
        access_token: shopifySettings.access_token,
        app_secret_key: shopifySettings.app_secret_key,
      });
      console.log("✅ Shopify API initialized for:", shopifySettings.shop_subdomain);
    }

    if (!shopifyAPI) {
      return new Response(JSON.stringify({
        error: "Shopify is not configured. Please configure Shopify in Settings to use this chat."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 7. Select the AI model
    const model = await selectModel(aiSettings);

    // 8. Build Shopify tools and system prompt
    const tools = createShopifyTools(shopifyAPI);

    const systemPrompt = `You are a Senior Shopify Business Analyst and Pro AI Assistant.
Your mission is to convert Shopify store data into clear visualizations and actionable business insights using GraphQL Admin API.

You NEVER hallucinate data or tools.

════════════════════════════════════
🚨 CRITICAL TOOL AVAILABILITY OVERRIDE
════════════════════════════════════

AVAILABLE TOOLS (ONLY THESE EXIST):

DATA FETCHING — Shopify Admin API (GraphQL)
════════════════════════════════════

DATA FETCHING
- getProducts → Fetch products with variants, prices, inventory
- getOrders → Fetch orders with line items, customer info, addresses,orders count,paid orders,pending ,refunded orders,top 5 orders,top 10
- getCustomers → Fetch customers  all time  with  count, top 5 customers by  spent ,top 10 customers 
- getStoreOverview → Comprehensive store performance metrics
- getLocations → Inventory locations
- getInventory → Inventory levels per location

VISUALIZATION
- createCard (for single KPI values)
- createChart
- createTable
- createMap (for geographic visualizations)
COMPUTATION
- codeInterpreter

❌ FORBIDDEN TOOLS (DO NOT EXIST — NEVER CALL)
- getCoupons
- getProductsAnalytics
- getOrdersAnalytics
- Any tool not listed above

KPI RULE:
If the result is a single numeric value (revenue, orders, customers),
YOU MUST use createCard instead of chart or table.

════════════════════════════════════
⚡ MANDATORY WORKFLOW (NO EXCEPTIONS)
════════════════════════════════════

1️⃣ UNDERSTAND & FETCH
- Determine if the request is:
  a) Simple list
  b) Analytics / trend
  c) Custom calculation
- Call the correct DATA FETCHING tool

2️⃣ VISUALIZE (REQUIRED)
- After ANY data fetch, you MUST call one of:
  - createCard OR
  - createTable OR
  - createChart
  - createMap
- You may call BOTH if useful
- NEVER print markdown tables
- NEVER duplicate the same visualization

3️⃣ INSIGHTS
- Provide 2–4 concise sentences explaining:
  - Trends
  - Outliers
  - Business meaning
- Do NOT repeat raw numbers already shown in the UI

🚫 NO ASSUMPTIONS / FETCH-FIRST RULE (CRITICAL)
You MUST ALWAYS fetch real Shopify data BEFORE:
- calculating
- summarizing
- creating KPIs
- drawing conclusions
- generating insights

STRICT RULES:
- NEVER answer from memory, intuition, or prior knowledge
- NEVER estimate values
- NEVER infer totals, revenue, or counts without a tool call
- NEVER run codeInterpreter without fetched data

MANDATORY ORDER (NO EXCEPTIONS):
1️⃣ FETCH data using an allowed DATA FETCHING tool
2️⃣ THEN compute (if needed) using codeInterpreter
3️⃣ THEN visualize using createCard / createTable / createChart / createMap
4️⃣ THEN provide insights

If data is unavailable:
- Explicitly say data cannot be fetched
- Do NOT guess or approximate

════════════════════════════════════
🗺 MAP VISUALIZATION RULES
════════════════════════════════════

Use createMap ONLY for location-based questions such as:
- map of orders
- orders by location / zip / pincode
- where customers are located

RULES:
- Fetch orders/customers first
- Convert ZIP / pincode → latitude & longitude (geocoding)
- Group ALL records by SAME lat + lng
- NEVER create one point per order

Each map point MUST include:
- label (ZIP or city)
- latitude
- longitude
- orderIds (array)

Point size/value = number of orders at that location.
- after you can show story with insights
DO NOT:
- Use charts or tables for geographic requests
- Show raw coordinates in text
- Invent locations or coordinates

If valid ZIP/location data is missing:
- Explain clearly why the map cannot be shown

════════════════════════════════════
📊 TOOL ROUTING RULES
════════════════════════════════════

SIMPLE LIST REQUESTS
Examples:
- "Show recent orders"
- "List products"
- "Show customers"

➡ Use:
- getOrders / getProducts / getCustomers
➡ Then:
- createTable
➡ If default pagination (10 items), inform the user

────────────────────────────────────

ANALYTICS / METRICS REQUESTS
Examples:
- "Revenue this month"
- "Sales trend"
- "Order performance"

➡ Use:
- getStoreOverview
➡ Then:
- createChart (trends)
- createTable (breakdowns)
➡ Default to last 30 days if no date range is given
➡ Tell the user the period used

────────────────────────────────────

CUSTOM / COMPLEX REQUESTS
Examples:
- "Average order value"
- "Customers who bought X"

➡ Use:
- codeInterpreter for calculations
➡ Then:
- createChart or createTable

════════════════════════════════════
📈 VISUALIZATION RULES (STRICT)
════════════════════════════════════

- Every data fetch MUST be visualized
- createChart:
  - Use bar for comparisons
  - Use line for trends
  - Use pie for composition
- createTable:
  - Use for detailed lists
- NEVER duplicate visuals
- NEVER show tool JSON
- NEVER show markdown tables

════════════════════════════════════
🛠 ERROR HANDLING & SELF-HEALING
════════════════════════════════════

If a tool call fails:
1. Analyze the error
2. Fix parameters or choose another ALLOWED tool
3. Retry immediately
4. Never switch to a forbidden tool
5. Always provide a text response explaining the outcome

Never stop after the first failure.

════════════════════════════════════
🔒 FINAL SAFETY CHECK (MANDATORY)
════════════════════════════════════

Before finishing:
- I used ONLY allowed tools
- I visualized all fetched data
- I did NOT show tool JSON
- I provided insights after visuals

If Shopify API IS configured:
- Start fetching and visualizing immediately
`;

    let aiBundle: {
      chart: any | null;
      table: any | null;
      card: any | null;
      map: any | null;
      story: any | null;
    } = {
      chart: null,
      table: null,
      card: null,
      map: null,
      story: null,
    };

    let streamError: string | null = null;

    // 9. Start streaming AI text with Shopify tool integration
    console.log("Registered tools:", Object.keys(tools));

    const result = streamText({
      model,
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: tools as any,

      onError: (err: any) => {
        const msg =
          err?.data?.error?.message ??
          err?.message ??
          "Unknown stream error";

        console.error("🔥Error:", msg);
        streamError = msg;
      },

      stopWhen: stepCountIs(25),
      maxRetries: 2,

      onStepFinish: async (step: any) => {
        const results: any[] = [];

        // Standard toolResults (OpenAI-style)
        if (Array.isArray(step?.toolResults)) {
          results.push(...step.toolResults);
        }

        // Tool messages (OpenRouter / Gemini-style)
        if (Array.isArray(step?.messages)) {
          for (const msg of step.messages) {
            if (msg.role === "tool" && Array.isArray(msg.content)) {
              for (const item of msg.content) {
                if (item.type === "tool-result") {
                  results.push({
                    toolName: item.toolName,
                    output: item.output,
                  });
                }
              }
            }
          }
        }

        for (const t of results) {
          const toolName = t?.toolName ?? t?.tool;
          const res = t?.output ?? t?.result ?? null;

          if (!toolName || !res) continue;

          // CARD HANDLER
          if (toolName === "createCard" || toolName === "card") {
            const res = t?.output ?? t?.result ?? null;
            if (!res?.cardData) continue;
            const card = res.cardData;
            aiBundle.card = {
              type: "card",
              data: {
                title: card.title ?? null,
                value: card.value ?? null,
                prefix: card.prefix ?? null,
                suffix: card.suffix ?? null,
                description: card.description ?? null,
              },
            };
          }

          // MAP HANDLER
          if (toolName === "createMap" || toolName === "map") {
            const mapData =
              res?.mapData ??
              res?.data ??
              res;

            if (mapData?.points?.length) {
              aiBundle.map = {
                type: "map",
                data: {
                  title: mapData.title ?? "Orders by Location",
                  points: mapData.points,
                },
              };
            }
          }

          // CHART HANDLER
          if (toolName === "createChart" || toolName === "chart") {
            let cfg = null;

            if (res?.chartConfig) cfg = res.chartConfig;
            else if (res?.data) cfg = res.data;
            else cfg = res;

            if (!cfg) continue;

            let rawRows: any[] = [];

            if (
              cfg.data?.labels &&
              Array.isArray(cfg.data.labels) &&
              cfg.data?.datasets?.[0]?.data
            ) {
              rawRows = cfg.data.labels.map((label: any, i: number) => ({
                [cfg.xAxisColumn ?? "x"]: label,
                [cfg.yAxisColumn ?? "y"]: cfg.data.datasets[0].data[i],
              }));
            }

            aiBundle.chart = {
              type: "chart",
              data: {
                type: cfg.type ?? "bar",
                title: cfg.title ?? "Chart",
                chartData: rawRows,
                xAxisColumn: cfg.xAxisColumn ?? "x",
                yAxisColumn: cfg.yAxisColumn ?? "y",
                datasetLabel: cfg.data?.datasets?.[0]?.label ?? "Data",
                options: cfg.options ?? {},
              },
            };
          }

          // TABLE HANDLER
          if (toolName === "createTable" || toolName === "table") {
            const table = res?.tableData ?? res?.data ?? res;

            aiBundle.table = {
              type: "table",
              data: {
                title: table.title ?? "Table",
                columns: table.columns ?? [],
                rows: table.rows ?? [],
                summary: table.summary ?? table.title ?? "",
              },
            };
          }

          // STORY HANDLER
          if (toolName === "createStory" || toolName === "story") {
            const content =
              res?.content ??
              res?.text ??
              (typeof res === "string" ? res : "");

            aiBundle.story = {
              type: "story",
              content,
            };
          }
        }

        console.log("Tool Results:", step.toolResults);
      },

      onFinish: async ({ response, usage }: any) => {
        try {
          // TOKEN EXTRACTION
          let promptTokens = usage?.promptTokens ?? null;
          let completionTokens = usage?.completionTokens ?? null;
          let totalTokens = usage?.totalTokens ?? null;

          if (totalTokens && (promptTokens === null || completionTokens === null)) {
            const estimatedPrompt = Math.round(totalTokens * 0.7);
            const estimatedCompletion = totalTokens - estimatedPrompt;
            promptTokens = estimatedPrompt;
            completionTokens = estimatedCompletion;
          }

          promptTokens = promptTokens ?? 0;
          completionTokens = completionTokens ?? 0;
          totalTokens = totalTokens ?? promptTokens + completionTokens;

          const tokenCost = calculateCost({
            promptTokens,
            completionTokens,
          });

          // SAVE USER MESSAGE FIRST
          const lastUserText =
            messages
              ?.filter((m) => m.role === "user")
              ?.at(-1)
              ?.parts
              ?.filter((p: any) => p.type === "text")
              ?.map((p: any) => p.text)
              ?.join("") ?? null;

          let userMessageId: any = null;

          if (lastUserText) {
            try {
              const savedUser = await saveUserMessage(
                chatUuid,
                lastUserText
              );
              userMessageId = savedUser?.data?.id ?? null;

              if (userMessageId) {
                await saveMessageTokenUsage({
                  messageId: userMessageId,
                  promptTokens,
                  completionTokens,
                  totalTokens,
                  tokenCost,
                });
              }
            } catch (err) {
              console.error("Failed to save user message:", err);
            }
          }

          // Find last assistant message content
          const lastAssistant = response?.messages
            ?.filter((m: any) => m.role === "assistant")
            ?.at(-1);

          // If NO story created, extract from lastAssistant
          if (!aiBundle.story) {
            const fallback =
              extractStoryText(lastAssistant?.content ?? "") ?? "";
            aiBundle.story = {
              type: "story",
              content: fallback,
            };
          }

          // FINAL OUTPUT: ALWAYS SAVE WHAT EXISTS
          let finalOutput: any = {};

          if (
            aiBundle.chart &&
            aiBundle.chart.data &&
            Array.isArray(aiBundle.chart.data.chartData)
          ) {
            finalOutput.chart = aiBundle.chart;
          }

          if (
            aiBundle.table &&
            aiBundle.table.data &&
            Array.isArray(aiBundle.table.data.rows)
          ) {
            finalOutput.table = aiBundle.table;
          }

          if (aiBundle.card && aiBundle.card.data) {
            finalOutput.card = aiBundle.card;
          }

          if (aiBundle.map && aiBundle.map.data?.points?.length) {
            finalOutput.map = aiBundle.map;
          }

          // ALWAYS SAVE STORY
          finalOutput.story = {
            type: "story",
            content: aiBundle.story?.content ?? "",
          };

          console.log("✅ Final AI Output to Save:", finalOutput);

          // SAVE ASSISTANT MESSAGE
          try {
            const savedAssistant = await saveAssistantMessage(
              chatUuid,
              lastAssistant?.id ?? null,
              finalOutput
            );

            const assistantMessageId =
              savedAssistant?.messageId ??
              savedAssistant?.data?.id ??
              null;

            if (assistantMessageId) {
              await saveMessageTokenUsage({
                messageId: assistantMessageId,
                promptTokens,
                completionTokens,
                totalTokens,
                tokenCost: calculateCost({ promptTokens, completionTokens }),
              });
            }
          } catch (err) {
            console.error("Failed to save assistant message:", err);
          }

          // Update chat totals
          try {
            await updateChatTotals({
              chatId: chatUuid,
              promptTokens,
              completionTokens,
              totalTokens,
              cost: tokenCost,
            });
          } catch (err) {
            console.error("Failed to update chat totals:", err);
          }

          console.log("USAGE RAW:", usage);
          console.log("TOKENS FINAL:", {
            promptTokens,
            completionTokens,
            totalTokens,
            tokenCost,
          });

        } catch (err) {
          console.error("❌ onFinish failed:", err);
        } finally {
          aiBundle = { chart: null, table: null, story: null, card: null, map: null };
        }
      }
    });

    if (streamError) {
      return new Response(
        JSON.stringify({ error: streamError }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 10. Return streaming response
    return result.toUIMessageStreamResponse({
      headers: {
        'Content-Encoding': 'none',
      },
      consumeSseStream: consumeStream,
    });

  } catch (err: any) {
    console.error("❌ Chat API Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
