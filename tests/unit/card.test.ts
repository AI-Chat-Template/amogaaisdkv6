import { describe, it, expect } from "vitest";
import { createWooCommerceTools } from "@/lib/ai/woomcp"; // adjust path

describe("createCard tool", () => {
  const tools = createWooCommerceTools(null);

  it("should return valid card response", async () => {
    const result = await tools.createCard.execute!(
      {
        title: "Total Revenue",
        value: "1000",
        prefix: "$",
        suffix: "",
        description: "This month",
      },
      {} as any // ToolExecutionOptions (not needed for this test)
    );

    expect(result.success).toBe(true);
    expect(result.displayType).toBe("card");
    expect(result.visualizationCreated).toBe(true);
    expect(result.cardData.title).toBe("Total Revenue");
    expect(result.cardData.value).toBe("1000");
  });
});