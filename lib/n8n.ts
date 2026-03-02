interface N8NCredential {
  id: string;
  name: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: unknown[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
  tags?: string[];
}

interface N8NExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  status: "success" | "error" | "running" | "waiting";
  data: {
    resultData: {
      runData: Record<string, unknown>;
    };
  };
}

export class N8NService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.N8N_API_URL as string;
    this.apiKey = process.env.N8N_API_KEY as string;

    if (!this.baseUrl || !this.apiKey) {
      throw new Error("N8N API URL and API Key must be configured");
    }
  }

  private async fetchN8N(
    endpoint: string,
    options: RequestInit = {},
    webhook = false
  ) {
    let url;
    if (webhook) {
      url = `${this.baseUrl.replace("/api/v1", "")}${endpoint}`;
    } else {
      url = `${this.baseUrl}${endpoint}`;
    }
    const response = await fetch(url, {
      ...options,
      headers: {
        "X-N8N-API-KEY": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.log("n8n url requeted", url);
      const error = await response.text();
      throw new Error(`N8N API Error: ${error}`);
    }

    return response.json();
  }

  async getWorkflow(identifier: string | number): Promise<N8NWorkflow | null> {
    try {
      if (typeof identifier === "number") {
        return await this.fetchN8N(`/workflows/${identifier}`);
      }

      // Search by name
      const workflows = await this.fetchN8N("/workflows");
      return (
        workflows.data.find((w: N8NWorkflow) => w.name === identifier) || null
      );
    } catch (error) {
      console.error("Error getting workflow:", error);
      return null;
    }
  }

  async createWorkflow(workflow: Partial<N8NWorkflow>): Promise<N8NWorkflow> {
    return await this.fetchN8N("/workflows", {
      method: "POST",
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(
    id: string,
    workflow: Partial<N8NWorkflow>
  ): Promise<N8NWorkflow> {
    return await this.fetchN8N(`/workflows/${id}`, {
      method: "PUT",
      body: JSON.stringify(workflow),
    });
  }

  async setWorkflowActive(id: string, active: boolean): Promise<N8NWorkflow> {
    return await this.fetchN8N(
      `/workflows/${id}/${active ? "activate" : "deactivate"}`,
      {
        method: "POST",
      }
    );
  }

  async createCredential(
    name: string,
    type: string,
    data: Record<string, unknown>
  ): Promise<N8NCredential> {
    console.log("create cred",{
        name,
        type,
        data,
      })
    return await this.fetchN8N("/credentials", {
      method: "POST",
      body: JSON.stringify({
        name,
        type,
        data,
      }),
    });
  }

  async deleteCredential(id: string): Promise<void> {
    await this.fetchN8N(`/credentials/${id}`, {
      method: "DELETE",
    });
  }

  async getExecution(id: string): Promise<N8NExecution> {
    return await this.fetchN8N(`/executions/${id}`);
  }

  async waitForExecution(
    id: string,
    timeoutMs: number = 30000,
    pollIntervalMs: number = 1000
  ): Promise<N8NExecution> {
    const startTime = Date.now();

    while (true) {
      const execution = await this.getExecution(id);

      if (execution.finished || execution.status === "error") {
        return execution;
      }

      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Execution timeout after ${timeoutMs}ms`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  async runWorkflow(
    workflowId: number,
    data?: Record<string, unknown>
  ): Promise<N8NExecution> {
    const execution = await this.fetchN8N(`/workflows/${workflowId}/execute`, {
      method: "POST",
      body: data ? JSON.stringify({ data }) : undefined,
    });

    return await this.waitForExecution(execution.id);
  }

  async runWorkflowFromTemplate(
    flowPayload: Record<string, unknown>
  ): Promise<{ executionId: string }> {
    const result = await this.fetchN8N(
      `/webhook/execute-custom-flow`,
      {
        method: "POST",
        body: JSON.stringify({ template: JSON.stringify(flowPayload) }),
      },
      true
    );
    console.log("run workflow from json result: ",result)

    // const response = await fetch(
    //   "https://flows.morr.biz/webhook/execute-custom-flow",
    //   {
    //     method: "POST",
    //     headers: {
    //       Accept: "application/json",
    //       "Content-Type": "application/json",
    //       "X-N8N-API-KEY": this.apiKey,
    //     },
    //     body: JSON.stringify({
    //       template: JSON.stringify(flowPayload),
    //     }),
    //   }
    // );

    // if (!response.ok) {
    //   const error = await response.text();
    //   throw new Error(`Failed to run workflow from template: ${error}`);
    // }
    // const result = await response.json();

    return { executionId: result.executionId };
  }

  async testWooCommerceConnection(
    siteUrl: string,
    consumerKey: string,
    consumerSecret: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = siteUrl.replace(/\/$/, "");
      const wcApiUrl = `${baseUrl}/wp-json/wc/v3`;

      const response = await fetch(
        `${wcApiUrl}/system_status?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
        {
          headers: {
            // Authorization:
            //   "Basic " +
            //   Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64"),
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          response.status === 401
            ? "Invalid API credentials"
            : `API Error (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();

      return {
        success: true,
        message: `Successfully connected to WooCommerce at ${siteUrl}. Store environment: ${
          data.environment?.version || "Unknown"
        }`,
      };
    } catch (error) {
      console.error("WooCommerce connection test failed:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to WooCommerce store",
      };
    }
  }

  async testShopifyConnection(
    shopSubdomain: string,
    accessToken: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Construct the Shopify Admin API URL
      const shopifyUrl = `https://${shopSubdomain}.myshopify.com/admin/api/2024-01`;

      // Try to fetch shop information as a connection test
      const response = await fetch(`${shopifyUrl}/shop.json`, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          response.status === 401
            ? "Invalid Shopify access token"
            : response.status === 404
            ? "Invalid shop domain"
            : `API Error (${response.status}): ${errorText}`
        );
      }

      const { shop } = await response.json();

      return {
        success: true,
        message: `Successfully connected to Shopify store: ${shop.name} (${shop.myshopify_domain})`,
      };
    } catch (error) {
      console.error("Shopify connection test failed:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to Shopify store",
      };
    }
  }
}

export const n8n = new N8NService();
