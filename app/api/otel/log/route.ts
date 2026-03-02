import { log } from "@/lib/otel";

export async function POST(req: Request) {
  const body = await req.json();

  await log("INFO", "page_load", {
    pathname: body.pathname,
  });

  return new Response("ok");
}
