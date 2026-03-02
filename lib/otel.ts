import { getOtelContext } from "./otel-context";

export const COLLECTOR_URL = process.env.NEXT_PUBLIC_OTEL_COLLECTOR_HTTP || "https://my-otel-collector.onrender.com";
const nano = (ms: number) => BigInt(ms) * BigInt(1_000_000);

const wrapAttr = (value: any) => {
  if (typeof value === "number") return { intValue: value };
  if (typeof value === "string") return { stringValue: value };
  return { stringValue: JSON.stringify(value) };
};

async function sendOTLP(payload: any) {
  await fetch(COLLECTOR_URL + "/v1/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function log(
  severity: string,
  message: string,
  attrs: Record<string, any> = {}
) {
  // pick up the pathname passed from the client
  const ctx = await getOtelContext(attrs.pathname);
  const ts = String(nano(Date.now()));

  // resource metadata
  const resource = [
    { key: "user_id", value: wrapAttr(ctx.user_id) },
    { key: "roles_json", value: wrapAttr(ctx.roles_json || []) },
    { key: "page", value: wrapAttr(ctx.page || "") },
  ];

  // actual log attributes
  const attributes = Object.entries(attrs).map(([k, v]) => ({
    key: k,
    value: wrapAttr(v),
  }));

  const payload = {
    resourceLogs: [
      {
        resource: { attributes: resource },
        scopeLogs: [
          {
            scope: { name: "manual" },
            logRecords: [
              {
                timeUnixNano: ts,
                severityText: severity,
                body: { stringValue: message },
                attributes,
              },
            ],
          },
        ],
      },
    ],
  };

  await sendOTLP(payload);
}
export async function chatwithdbdata({
  chatId,
  userPrompt,
  aiResponse,
  promptTokens,
  completionTokens,
  totalTokens,
  tokenCost,
  latencyMs,
  pathname,
}: {
  chatId: string;
  userPrompt: string;
  aiResponse: any;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  tokenCost: number;
  latencyMs: number;
  pathname?: string;
}) {
  return log("INFO", "chat.completed", {
    pathname,

    // 🔑 routing key (collector uses this)
    "log.type": "chatwithdb",

    // chat identity
    "chat.id": chatId,

    // content
    "chat.user_prompt": userPrompt,
    "chat.ai_response": aiResponse,

    // usage
    "tokens.prompt": promptTokens,
    "tokens.completion": completionTokens,
    "tokens.total": totalTokens,
    "tokens.cost": tokenCost,

    // performance
    "latency.ms": latencyMs,
  });
}
