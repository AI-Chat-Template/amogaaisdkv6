"use server";

import { streamText, UIMessage, convertToModelMessages, stepCountIs, consumeStream } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createPostgresRestTools, PostgresRestAPI, extractPostgresRestCredentials } from "@/lib/ai/RestAPImcp";
import { auth } from "@/auth";
import { postgrest } from "@/lib/postgrest";
import { v4 as uuidv4 } from "uuid";
import {
  saveMessageTokenUsage,
  updateChatTotals,
  saveAssistantMessage,
  saveUserMessage    // ✅ ADD THIS
} from "@/app/(authenticated)/ChatwithRestAPI/actions";

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
// SIMPLE TOKEN COST CALCULATOR (GLOBAL)
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

  // message content sometimes is an array of parts (TextPart)
  if (Array.isArray(content)) {
    return content.map((c: any) => c?.text ?? "").join("").trim();
  }

  // or content could be object with text property
  if (typeof content === "object" && content !== null) {
    if (typeof content.text === "string") return content.text;
    // some SDKs place parts under content.parts
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
// =====================================================
// SIMPLE TOKEN COST CALCULATOR (GLOBAL FUNCTION)
// =====================================================


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

    // 5. PostgresREST API setup
    // Extract credentials from api_connection_json
    let pgRestAPI: PostgresRestAPI | null = null;
    
    try {
      if (Array.isArray(data.api_connection_json)) {
        // Find the first active PostgreSQL REST API configuration
        const pgRestEntry = data.api_connection_json.find((api: any) => 
          api.type === "postgresrest" && api.status === "active"
        );
        
        if (pgRestEntry) {
          console.log("Found active PostgresREST config:", pgRestEntry.App_name || pgRestEntry.apiname);
          
          const pgRestConfig = {
            url: pgRestEntry.url,
            token: pgRestEntry.token,
            schema: pgRestEntry.schema || 'public'
          };
          
          if (pgRestConfig.url && pgRestConfig.token) {
            pgRestAPI = new PostgresRestAPI(pgRestConfig);
          }
        } else {
          console.warn("No active PostgresREST API configuration found");
        }
      } else if (data.api_connection_json && typeof data.api_connection_json === 'object') {
        // Handle case where api_connection_json is a single object
        // Check if it's a PostgresREST type and active
        if (
          data.api_connection_json.type === "postgresrest" && 
          data.api_connection_json.status === "active"
        ) {
          const config = {
            url: data.api_connection_json.url,
            token: data.api_connection_json.token,
            schema: data.api_connection_json.schema || 'public'
          };
          
          if (config.url && config.token) {
            pgRestAPI = new PostgresRestAPI(config);
          }
        }
      }
    } catch (error) {
      console.error("Error initializing PostgresREST API:", error);
    }
    // 7. Select the AI model
    const model = await selectModel(aiSettings);

   
const systemPrompt = `You are a Database Analyst and Pro AI Assistant for PostgreSQL REST API.
Your mission is to convert database data into clear visualizations and actionable business insights.

You NEVER hallucinate data or tools.

════════════════════════════════════
🚨 CRITICAL TOOL AVAILABILITY OVERRIDE
════════════════════════════════════

AVAILABLE TOOLS (ONLY THESE EXIST):

DATA FETCHING — PostgreSQL REST API
════════════════════════════════════

DATA FETCHING
- getTableData (primary tool for querying any table)
- getRecords (fetch 5 or 10 records from a table - use for quick preview)
- executeRPC (for calling PostgreSQL functions)
- getCardData (for card visualizations)
- getTableMapData (for table visualizations)
- getChatData (for retrieving chat history)

IMPORTANT:
- Do NOT use 'count(*)' in select parameter - use 'count' instead
- Do NOT specify 'order' parameter unless user explicitly asks for sorting
- For "last X records", automatically determine which column to sort by (use common columns like id, created_at, date, updated_at)
- ALWAYS fetch the data first, then decide which columns to use for visualization
- Do NOT ask user to specify columns - automatically select appropriate columns based on the data

🚫 NEVER ASK USER FOR COLUMNS - ALWAYS DECIDE AUTOMATICALLY from that table

VISUALIZATION
- createCard (for single KPI values)
- createChart
- createTable
- createMap (for geographic / location-based visualizations)

COMPUTATION
- runCode (for custom data processing)

❌ FORBIDDEN TOOLS (DO NOT EXIST — NEVER CALL)
- getProducts
- getOrders
- getCustomers
- getReports
- getData
- Any tool not listed above

KPI RULE:
If the result is a single numeric value (revenue, users, counts),
YOU MUST use createCard instead of chart or table.

🚫 If a user asks about something that suggests a forbidden tool,
you MUST automatically re-route to an allowed tool.
Never attempt the forbidden tool first.

════════════════════════════════════
⚡ MANDATORY WORKFLOW (NO EXCEPTIONS)
════════════════════════════════════

1️⃣ UNDERSTAND & FETCH
- Determine if the request is:
  a) Simple table query
  b) Analytics / trend
  c) Custom calculation
- Call the correct DATA FETCHING tool

2️⃣ VISUALIZE (REQUIRED)
- After ANY data fetch, you MUST call visualization tools:
- createTable (ALWAYS call for table data)
- createChart (call if user asks for chart/graph)
- createCard (call for single KPI values)
- createMap (for geographic data)
- If user asks for "chart and table", you MUST call BOTH createChart AND createTable

════════════════════════════════════
🚫 NO ASSUMPTIONS / FETCH-FIRST RULE (CRITICAL)
════════════════════════════════════

You MUST ALWAYS fetch real PostgreSQL data BEFORE:
- calculating
- summarizing
- creating KPIs
- drawing conclusions
- generating insights

STRICT RULES - NEVER ASK USER FOR ANYTHING:
- NEVER ask user to specify columns - you MUST automatically determine columns from fetched data
- NEVER ask user to specify sort column - use common columns like id, created_at automatically
- NEVER answer from memory, intuition, or prior knowledge
- NEVER estimate values
- NEVER infer totals, counts without a tool call
- NEVER run runCode without fetched data

MANDATORY ORDER (NO EXCEPTIONS):
1️⃣ FETCH data using an allowed DATA FETCHING tool
2️⃣ THEN compute (if needed) using runCode
3️⃣ THEN visualize:
   - ALWAYS call createTable for any table data request
   - If user asks for chart, you MUST call createChart IN ADDITION to createTable
   - If user asks for "chart and table" or "with chart and table", you MUST call BOTH createChart AND createTable
   - If user asks for KPI/single value, call createCard
4️⃣ THEN provide insights

⚠️ CRITICAL: If user asks for chart and table, you MUST call createChart AND createTable - both tools must be called!

If data is unavailable:
- Explicitly say data cannot be fetched
- Do NOT guess or approximate

Violating this rule is a critical failure.

════════════════════════════════════
🗺 MAP VISUALIZATION RULES
════════════════════════════════════

Use createMap ONLY for location-based questions such as:
- map of locations
- geographical distribution
- where users are located

RULES:
- Fetch data first
- If available, use latitude and longitude data
- Group records by location
- NEVER create one point per record

Each map point MUST include:
- label (location name)
- latitude
- longitude
- value (count or metric)

Point size/value = number of records at that location.
After visualization, show story with insights.

DO NOT:
- Use charts or tables for geographic requests
- Show raw coordinates in text
- Invent locations or coordinates

If valid location data is missing:
- Explain clearly why the map cannot be shown

════════════════════════════════════
3️⃣ INSIGHTS
- Provide 2–4 concise sentences explaining:
  - Trends
  - Outliers
  - Business meaning
- Do NOT repeat raw numbers already shown in the UI

════════════════════════════════════
📊 TOOL ROUTING RULES
════════════════════════════════════

SIMPLE TABLE REQUESTS
Examples:
- "Show data from users table"
- "List records from products"
- "Show customer information"
- "Show last 5 records from orders with chart and table" (use getRecords for 5/10 records)

➡ Use:
- getTableData (for general queries)
- getRecords (for 5 or 10 records quick preview)
➡ Then automatically:
- Call createTable with ALL columns from fetched data
- If user asks for chart, call createChart using appropriate numeric columns
- Do NOT ask user to specify columns
➡ If default pagination (20 items), inform the user

────────────────────────────────────

ANALYTICS / METRICS REQUESTS
Examples:
- "Count of users"
- "Data trends"
- "Performance metrics"

➡ Use:
- getTableData with appropriate filters
➡ Then:
- createChart (trends)
- createTable (breakdowns)
➡ Default to all available data if no range is given
➡ Tell the user the data range used

────────────────────────────────────

CUSTOM / COMPLEX REQUESTS
Examples:
- "Average values"
- "Top performers"
- "Custom metrics"

➡ Use:
- getTableData or executeRPC
➡ Use:
- runCode for calculations
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
- I did NOT call any forbidden tools
- I did NOT show tool JSON
- I provided insights after visuals
- I did NOT ask user for columns - I determined them automatically

════════════════════════════════════
🔧 CONFIGURATION CHECK
════════════════════════════════════

If PostgreSQL REST API is NOT configured:
- Do NOT fetch data
- Guide the user to the Settings page

If PostgreSQL REST API IS configured:
- Start fetching and visualizing immediately
`
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
    // 9. Start streaming AI text with WooCommerce tool integration
    console.log("Registered tools:", Object.keys(createPostgresRestTools(pgRestAPI)));

    const result = streamText({
      model,
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: createPostgresRestTools(pgRestAPI) as any,

    
       onError: (err: any) => {
    const msg =
      err?.data?.error?.message ??
      err?.message ??
      "Unknown stream error";

    console.error("🔥Error:", msg);

    // store message instead of throwing
    streamError = msg;
  },
      // toolChoice: "auto", 
      stopWhen: stepCountIs(25),
      maxRetries:2,

      
  onStepFinish: async (step: any) => {
    
const results: any[] = [];

// 1️⃣ Standard toolResults (OpenAI-style)
if (Array.isArray(step?.toolResults)) {
  results.push(...step.toolResults);
}

// 2️⃣ Tool messages (OpenRouter / Gemini-style)
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
 if (toolName === "createCard" || toolName === "card") {
  // Handle both object and string output
  let cardData = res?.cardData;
  if (!cardData && typeof res === 'string') {
    try {
      const parsed = JSON.parse(res);
      cardData = parsed?.cardData;
    } catch (e) {
      // Not JSON string
    }
  }
  
  if (!cardData) continue;

  const card = cardData;

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


   // -------------------------------------------------------
// MAP HANDLER
// -------------------------------------------------------
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

    // -------------------------------------------------------
    // FIXED UNIVERSAL CHART HANDLER
    // -------------------------------------------------------
    if (toolName === "createChart" || toolName === "chart") {
      let cfg = null;

      if (res?.chartConfig) cfg = res.chartConfig;
      else if (res?.data) cfg = res.data;
      else cfg = res;

      if (!cfg) continue;

      // Rebuild RAW rows from chartConfig (labels + dataset)
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

    // -------------------------------------------------------
    // TABLE HANDLER — RAW ALWAYS SAVED
    // -------------------------------------------------------
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

    // -------------------------------------------------------
    // STORY HANDLER
    // -------------------------------------------------------
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


   // >>> REPLACE YOUR CURRENT onFinish WITH THIS ONE <<<

 onFinish: async ({ response, usage }: any) => {
  try {
    // ---------------------------------------
// TOKEN EXTRACTION (PRODUCTION SAFE)
// ---------------------------------------

let promptTokens = usage?.promptTokens ?? null;
let completionTokens = usage?.completionTokens ?? null;
let totalTokens = usage?.totalTokens ?? null;

// If provider only returns totalTokens
if (totalTokens && (promptTokens === null || completionTokens === null)) {
  // Split roughly 70/30 if unknown
  const estimatedPrompt = Math.round(totalTokens * 0.7);
  const estimatedCompletion = totalTokens - estimatedPrompt;

  promptTokens = estimatedPrompt;
  completionTokens = estimatedCompletion;
}

// Final safety fallback
promptTokens = promptTokens ?? 0;
completionTokens = completionTokens ?? 0;
totalTokens =
  totalTokens ?? promptTokens + completionTokens;

const tokenCost = calculateCost({
  promptTokens,
  completionTokens,
});

    // -------------------------------
    // SAVE USER MESSAGE FIRST
    // -------------------------------
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

    // ---------------------------------------
    // FINAL OUTPUT: ALWAYS SAVE WHAT EXISTS
    // ---------------------------------------
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
    // ---------------------------------------
    // SAVE ASSISTANT MESSAGE
    // ---------------------------------------
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

    // update chat totals
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
    aiBundle = { chart: null, table: null, story: null, card: null, map: null};
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
    // 10. Return streaming response with appropriate headers
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

