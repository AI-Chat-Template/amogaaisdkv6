export async function clientLog(body: string, attributes: Record<string, any> = {}) {
  await fetch("/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, attributes }),
  });
}
