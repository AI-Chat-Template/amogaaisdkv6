import { MCPClient } from "@mastra/mcp";

export const mcp = new MCPClient({
  servers: {
    marketing: {
      url: new URL("https://automate.morr.biz/mcp/woocommerce-mcp/sse"),
    },
  },
});