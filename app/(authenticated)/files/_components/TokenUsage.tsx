import { memo } from "react";
import { Coins } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TokenUsageProps {
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const TokenUsage = memo(({ tokenUsage }: TokenUsageProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-1">
          <Coins className="w-5 h-5 text-yellow-500" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p>Prompt Tokens: {tokenUsage.promptTokens}</p>
          <p>Completion Tokens: {tokenUsage.completionTokens}</p>
          <p>Total Tokens: {tokenUsage.totalTokens}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
));

TokenUsage.displayName = "TokenUsage";
export default TokenUsage;
