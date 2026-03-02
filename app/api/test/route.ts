import { log } from "@/lib/otel";

export async function GET() {
  await log("INFO", "Testing OTEL logging", { code: "TEST123" });

  return Response.json({ ok: true });
}
