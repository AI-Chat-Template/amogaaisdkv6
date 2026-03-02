import { anthropicDefaultModelId, anthropicModels, deepSeekDefaultModelId, deepSeekModels, geminiDefaultModelId, geminiModels, openAiNativeDefaultModelId, openAiNativeModels, openRouterDefaultModelId, openRouterDefaultModelInfo } from '@/shared/api';
import type { ModelMessage, UIMessage, ToolCallPart, ToolResultPart } from 'ai';

// This function converts DB messages (CoreMessage format) to UI messages (useChat format)
export function convertToUIMessages(dbMessages: any[]): UIMessage[] {
    const uiMessages: UIMessage[] = [];

    for (const dbMessage of dbMessages) {
        // User messages are straightforward
        if (dbMessage.role === 'user') {
            uiMessages.push({
                id: dbMessage.id!,
                role: 'user',
                content: dbMessage.content,
            });
            continue;
        }

        // Assistant messages might start a tool call
        if (dbMessage.role === 'assistant') {
            const toolCallParts = dbMessage.parts?.filter(
                (part: any): part is ToolCallPart => part.type === 'tool-call'
            );

            uiMessages.push({
                id: dbMessage.id!,
                role: 'assistant',
                content: dbMessage.content,
                toolInvocations: toolCallParts?.map((tc: any) => ({
                    toolCallId: tc.toolCallId,
                    toolName: tc.toolName,
                    args: tc.args,
                }))
            });
            continue;
        }

        // Tool messages provide the result. We need to find the assistant message
        // it belongs to and add the result to its `toolInvocations`.
        if (dbMessage.role === 'tool') {
            const toolResultPart = dbMessage.parts?.[0] as ToolResultPart;
            if (!toolResultPart) continue;

            const assistantMessage = uiMessages.find(msg =>
                msg.role === 'assistant' && msg.toolInvocations?.some(
                    ti => ti.toolCallId === toolResultPart.toolCallId
                )
            );

            if (assistantMessage && assistantMessage.toolInvocations) {
                const invocation = assistantMessage.toolInvocations.find(
                    ti => ti.toolCallId === toolResultPart.toolCallId
                );
                if (invocation) {
                    (invocation as any).result = toolResultPart.result;
                }
            }
        }
    }
    return uiMessages;
}

export const PROVIDER_MODELS: Record<string, { models: Record<string, any>, default: string }> = {
    google: { models: geminiModels, default: geminiDefaultModelId },
    openai: { models: openAiNativeModels, default: openAiNativeDefaultModelId },
    openrouter: { models: { [openRouterDefaultModelId]: openRouterDefaultModelInfo }, default: openRouterDefaultModelId },
    anthropic: { models: anthropicModels, default: anthropicDefaultModelId },
    deepseek: { models: deepSeekModels, default: deepSeekDefaultModelId },
};

export function calculateAICost({
    provider,
    model,
    promptTokens,
    completionTokens,
}: {
    provider: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
}): number | null {
    // Try to get model info from PROVIDER_MODELS
    const modelInfo = PROVIDER_MODELS?.[provider]?.models?.[model];
    if (!modelInfo) return null;
    // Prices are per million tokens
    const inputPrice = modelInfo.inputPrice ?? 0;
    const outputPrice = modelInfo.outputPrice ?? 0;
    const costInDollars =
        (promptTokens / 1_000_000) * inputPrice +
        (completionTokens / 1_000_000) * outputPrice;

    // const costInMicroDollars = Math.round(costInDollars * 1_000_000);
    const roundedCost = parseFloat(costInDollars.toFixed(6));
    
    console.log(`Calculated cost: $${costInDollars.toFixed(8)}, Storing as numeric: ${roundedCost}`);

    return roundedCost;
}
