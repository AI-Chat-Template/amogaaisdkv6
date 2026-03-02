interface PriceTier {
  tokenLimit: number; // Upper limit (inclusive) of *input* tokens for this price. Use Infinity for the highest tier.
  price: number; // Price per million tokens for this tier.
}

export interface ModelInfo {
  maxTokens?: number;
  contextWindow?: number;
  supportsImages?: boolean;
  supportsPromptCache: boolean; // this value is hardcoded for now
  inputPrice?: number; // Keep for non-tiered input models
  outputPrice?: number; // Keep for non-tiered output models
  thinkingConfig?: {
    maxBudget?: number; // Max allowed thinking budget tokens
    outputPrice?: number; // Output price per million tokens when budget > 0
    outputPriceTiers?: PriceTier[]; // Optional: Tiered output price when budget > 0
  };
  supportsGlobalEndpoint?: boolean; // Whether the model supports a global endpoint with Vertex AI
  cacheWritesPrice?: number;
  cacheReadsPrice?: number;
  description?: string;
  tiers?: {
    contextWindow: number;
    inputPrice?: number;
    outputPrice?: number;
    cacheWritesPrice?: number;
    cacheReadsPrice?: number;
  }[];
}

export type GeminiModelId = keyof typeof geminiModels;
export const geminiDefaultModelId: GeminiModelId = "gemini-2.5-pro";
export const geminiModels = {
  "gemini-2.5-pro": {
    maxTokens: 65536,
    contextWindow: 1_048_576,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 2.5,
    outputPrice: 15,
    cacheReadsPrice: 0.625,
    thinkingConfig: {
      maxBudget: 32767,
    },
    tiers: [
      {
        contextWindow: 200000,
        inputPrice: 1.25,
        outputPrice: 10,
        cacheReadsPrice: 0.31,
      },
      {
        contextWindow: Infinity,
        inputPrice: 2.5,
        outputPrice: 15,
        cacheReadsPrice: 0.625,
      },
    ],
  },
  "gemini-2.5-flash-lite-preview-06-17": {
    maxTokens: 64000,
    contextWindow: 1_000_000,
    supportsImages: true,
    supportsPromptCache: true,
    supportsGlobalEndpoint: true,
    inputPrice: 0.1,
    outputPrice: 0.4,
    cacheReadsPrice: 0.025,
    description: "Preview version - may not be available in all regions",
    thinkingConfig: {
      maxBudget: 24576,
    },
  },
  "gemini-2.5-flash": {
    maxTokens: 65536,
    contextWindow: 1_048_576,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0.3,
    outputPrice: 2.5,
    cacheReadsPrice: 0.075,
    thinkingConfig: {
      maxBudget: 24576,
      outputPrice: 3.5,
    },
  },
  "gemini-2.0-flash-001": {
    maxTokens: 8192,
    contextWindow: 1_048_576,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0.1,
    outputPrice: 0.4,
    cacheReadsPrice: 0.025,
    cacheWritesPrice: 1.0,
  },
  "gemini-2.0-flash-lite-preview-02-05": {
    maxTokens: 8192,
    contextWindow: 1_048_576,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
  },
  "gemini-2.0-pro-exp-02-05": {
    maxTokens: 8192,
    contextWindow: 2_097_152,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
  },
  "gemini-2.0-flash-thinking-exp-01-21": {
    maxTokens: 65_536,
    contextWindow: 1_048_576,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
  },
  "gemini-2.0-flash-thinking-exp-1219": {
    maxTokens: 8192,
    contextWindow: 32_767,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
  },
  "gemini-2.0-flash-exp": {
    maxTokens: 8192,
    contextWindow: 1_048_576,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
  },
  "gemini-1.5-flash-002": {
    maxTokens: 8192,
    contextWindow: 1_048_576,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0.15, // Default price (highest tier)
    outputPrice: 0.6, // Default price (highest tier)
    cacheReadsPrice: 0.0375,
    cacheWritesPrice: 1.0,
    tiers: [
      {
        contextWindow: 128000,
        inputPrice: 0.075,
        outputPrice: 0.3,
        cacheReadsPrice: 0.01875,
      },
      {
        contextWindow: Infinity,
        inputPrice: 0.15,
        outputPrice: 0.6,
        cacheReadsPrice: 0.0375,
      },
    ],
  },
  "gemini-1.5-flash-exp-0827": {
    maxTokens: 8192,
    contextWindow: 1_048_576,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
  },
  "gemini-1.5-flash-8b-exp-0827": {
    maxTokens: 8192,
    contextWindow: 1_048_576,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
  },
  "gemini-1.5-pro-002": {
    maxTokens: 8192,
    contextWindow: 2_097_152,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
  },
  "gemini-1.5-pro-exp-0827": {
    maxTokens: 8192,
    contextWindow: 2_097_152,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
  },
  "gemini-exp-1206": {
    maxTokens: 8192,
    contextWindow: 2_097_152,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
  },
} as const satisfies Record<string, ModelInfo>;

export type OpenAiNativeModelId = keyof typeof openAiNativeModels;
export const openAiNativeDefaultModelId: OpenAiNativeModelId =
  "gpt-5-2025-08-07";
export const openAiNativeModels = {
  "gpt-5-2025-08-07": {
    maxTokens: 128000,
    contextWindow: 272000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 1.25,
    outputPrice: 10.0,
    cacheReadsPrice: 0.125,
  },
  "gpt-5-mini-2025-08-07": {
    maxTokens: 128000,
    contextWindow: 272000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0.25,
    outputPrice: 2.0,
    cacheReadsPrice: 0.025,
  },
  "gpt-5-nano-2025-08-07": {
    maxTokens: 128000,
    contextWindow: 272000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0.05,
    outputPrice: 0.4,
    cacheReadsPrice: 0.005,
  },
  "nectarine-alpha-new-reasoning-effort-2025-07-25": {
    maxTokens: 128000,
    contextWindow: 256000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0,
    outputPrice: 0,
    cacheReadsPrice: 0,
  },
  o3: {
    maxTokens: 100_000,
    contextWindow: 200_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 2.0,
    outputPrice: 8.0,
    cacheReadsPrice: 0.5,
  },
  "o4-mini": {
    maxTokens: 100_000,
    contextWindow: 200_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 1.1,
    outputPrice: 4.4,
    cacheReadsPrice: 0.275,
  },
  "gpt-4.1": {
    maxTokens: 32_768,
    contextWindow: 1_047_576,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 2,
    outputPrice: 8,
    cacheReadsPrice: 0.5,
  },
  "gpt-4.1-mini": {
    maxTokens: 32_768,
    contextWindow: 1_047_576,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0.4,
    outputPrice: 1.6,
    cacheReadsPrice: 0.1,
  },
  "gpt-4.1-nano": {
    maxTokens: 32_768,
    contextWindow: 1_047_576,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0.1,
    outputPrice: 0.4,
    cacheReadsPrice: 0.025,
  },
  "o3-mini": {
    maxTokens: 100_000,
    contextWindow: 200_000,
    supportsImages: false,
    supportsPromptCache: true,
    inputPrice: 1.1,
    outputPrice: 4.4,
    cacheReadsPrice: 0.55,
  },
  // don't support tool use yet
  o1: {
    maxTokens: 100_000,
    contextWindow: 200_000,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 15,
    outputPrice: 60,
    cacheReadsPrice: 7.5,
  },
  "o1-preview": {
    maxTokens: 32_768,
    contextWindow: 128_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 15,
    outputPrice: 60,
    cacheReadsPrice: 7.5,
  },
  "o1-mini": {
    maxTokens: 65_536,
    contextWindow: 128_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 1.1,
    outputPrice: 4.4,
    cacheReadsPrice: 0.55,
  },
  "gpt-4o": {
    maxTokens: 4_096,
    contextWindow: 128_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 2.5,
    outputPrice: 10,
    cacheReadsPrice: 1.25,
  },
  "gpt-4o-mini": {
    maxTokens: 16_384,
    contextWindow: 128_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0.15,
    outputPrice: 0.6,
    cacheReadsPrice: 0.075,
  },
  "chatgpt-4o-latest": {
    maxTokens: 16_384,
    contextWindow: 128_000,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 5,
    outputPrice: 15,
  },
  "gpt-4.5-preview": {
    maxTokens: 16_384,
    contextWindow: 128_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 75,
    outputPrice: 150,
  },
} as const satisfies Record<string, ModelInfo>;

export type AnthropicModelId = keyof typeof anthropicModels;
export const anthropicDefaultModelId: AnthropicModelId =
  "claude-sonnet-4-20250514";
export const anthropicModels = {
  "claude-sonnet-4-20250514": {
    maxTokens: 8192,
    contextWindow: 200_000,
    supportsImages: true,

    supportsPromptCache: true,
    inputPrice: 3.0,
    outputPrice: 15.0,
    cacheWritesPrice: 3.75,
    cacheReadsPrice: 0.3,
  },
  "claude-opus-4-1-20250805": {
    maxTokens: 8192,
    contextWindow: 200_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 15.0,
    outputPrice: 75.0,
    cacheWritesPrice: 18.75,
    cacheReadsPrice: 1.5,
  },
  "claude-opus-4-20250514": {
    maxTokens: 8192,
    contextWindow: 200_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 15.0,
    outputPrice: 75.0,
    cacheWritesPrice: 18.75,
    cacheReadsPrice: 1.5,
  },
  "claude-3-7-sonnet-20250219": {
    maxTokens: 8192,
    contextWindow: 200_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 3.0,
    outputPrice: 15.0,
    cacheWritesPrice: 3.75,
    cacheReadsPrice: 0.3,
  },
  "claude-3-5-sonnet-20241022": {
    maxTokens: 8192,
    contextWindow: 200_000,
    supportsImages: true,

    supportsPromptCache: true,
    inputPrice: 3.0, // $3 per million input tokens
    outputPrice: 15.0, // $15 per million output tokens
    cacheWritesPrice: 3.75, // $3.75 per million tokens
    cacheReadsPrice: 0.3, // $0.30 per million tokens
  },
  "claude-3-5-haiku-20241022": {
    maxTokens: 8192,
    contextWindow: 200_000,
    supportsImages: false,
    supportsPromptCache: true,
    inputPrice: 0.8,
    outputPrice: 4.0,
    cacheWritesPrice: 1.0,
    cacheReadsPrice: 0.08,
  },
  "claude-3-opus-20240229": {
    maxTokens: 4096,
    contextWindow: 200_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 15.0,
    outputPrice: 75.0,
    cacheWritesPrice: 18.75,
    cacheReadsPrice: 1.5,
  },
  "claude-3-haiku-20240307": {
    maxTokens: 4096,
    contextWindow: 200_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0.25,
    outputPrice: 1.25,
    cacheWritesPrice: 0.3,
    cacheReadsPrice: 0.03,
  },
} as const satisfies Record<string, ModelInfo>; // as const assertion makes the object deeply readonly

export type MistralModelId = keyof typeof mistralModels;
export const mistralDefaultModelId: MistralModelId = "mistral-large-latest";
export const mistralModels = {
  "mistral-large-latest": {
    maxTokens:500,
    contextWindow: 200_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0.25,
    outputPrice: 1.25,
    cacheWritesPrice: 0.3,
    cacheReadsPrice: 0.03,
  },
};
export type GroqModelId = keyof typeof groqModels;
export const groqDefaultModelId: GroqModelId = "llama-3.3-70b-versatile";

export const groqModels = {
  "llama-3.3-70b-versatile": {
    maxTokens: 256_000,          // adjust based on Groq model specs
    contextWindow: 256_000,      // adjust if different
    supportsImages: false,
    supportsPromptCache: false,
    inputPrice: 0,               // optional, Groq pricing may not apply here
    outputPrice: 0,              // optional
    description: "Groq LLaMA-3.3 70B versatile model",
  },
  "llama-3.3-70b-code": {
    maxTokens: 256_000,
    contextWindow: 256_000,
    supportsImages: false,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
    description: "Groq LLaMA-3.3 70B optimized for coding tasks",
  },
} as const satisfies Record<string, ModelInfo>;

export type DeepSeekModelId = keyof typeof deepSeekModels;
export const deepSeekDefaultModelId: DeepSeekModelId = "deepseek-chat";

export const deepSeekModels = {
  "deepseek-chat": {
    maxTokens:528,
    contextWindow: 128_000,
    supportsImages: false,
    supportsPromptCache: true,
    inputPrice: 0.56,       // cache miss
    outputPrice: 1.68,
    cacheReadsPrice: 0.07,  // cache hit reading
    description: "DeepSeek Chat model (128k context)",
  }
} as const satisfies Record<string, ModelInfo>;

// ================================
// OpenRouter (Qwen) Models
// ================================

export type OpenRouterModelId = keyof typeof openRouterModels;

export const openRouterDefaultModelId: OpenRouterModelId =
  "openai/gpt-4o-mini";

export const openRouterModels = {
  "openai/gpt-4o-mini": {
    maxTokens: 32_768,              // practical output cap
    contextWindow: 200_000,         // OpenRouter advertised window
    supportsImages: false,
    supportsPromptCache: false,     // OpenRouter does not expose cache
    inputPrice: 0,                  // pricing varies / often bundled
    outputPrice: 0,
    description:
      "gpt Thinking model via OpenRouter. Best for deep reasoning. Not tool-safe.",
    thinkingConfig: {
      maxBudget: 32_768,            // thinking tokens
    },
  },
    "qwen/qwen-2.5-vl-7b-instruct": {
    maxTokens: 8_192,
    contextWindow: 32_768,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
    description:
      "Qwen 2.5 VL 7B via OpenRouter. Vision-capable, instruction-following. No structured output.",
  },
  "qwen/qwen3-235b-a22b": {
    maxTokens: 32_768,
    contextWindow: 200_000,
    supportsImages: false,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
    description:
      "Qwen 3 235B model via OpenRouter. Best for deep reasoning. Not tool-safe.",
  },
  "qwen/qwen-vl-max": {
    maxTokens: 8_192,
    contextWindow: 32_768,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
    description:
      "Qwen 2.5 VL 7B via OpenRouter. Vision-capable, instruction-following. No structured output.",
  },
  "qwen/qwen2.5-14b-instruct": {
    maxTokens: 8_192,
    contextWindow: 67_768,
    supportsImages: true,
    supportsPromptCache: false,
    inputPrice: 0,
    outputPrice: 0,
    description:
      "Qwen2.5-14B-Instruct via OpenRouter. Vision-capable, instruction-following. No structured output.",
  },
  "google/gemini-2.5-flash": {
  maxTokens: 8_192,
  contextWindow: 1_000_000,
  supportsImages: true,
  supportsPromptCache: false,
  inputPrice: 0,
  outputPrice: 0,
  description:
    "Gemini 2.5 Flash Preview (09-2025) via OpenRouter. Ultra-long context (1M tokens), fast, multimodal. Preview/free tier limits apply.",
},

} as const satisfies Record<string, ModelInfo>;
