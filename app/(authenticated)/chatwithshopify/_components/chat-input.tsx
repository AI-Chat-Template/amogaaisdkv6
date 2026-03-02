"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  SlidersHorizontal,
  Wrench,
  Mic,
  MicOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

type AIModel = { model: string };
type APIEntry = { site_url: string };

type ChatInputProps = {
  chatUuid: string;
  onNewMessage?: (role: "user" | "assistant", content: any) => void;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function ChatInput({
  chatUuid,
  onNewMessage,
  setIsLoading,
  setErrorMessage,
  
}: ChatInputProps) {
  const [aiApis, setAiApis] = useState<AIModel[]>([]);
  const [apis, setApis] = useState<APIEntry[]>([]);
  const [selectedModelIdx, setSelectedModelIdx] = useState(0);
  const [selectedApiIdx, setSelectedApiIdx] = useState(0);

  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const assistantBundleRef = useRef({
    chart: null as any,
    table: null as any,
    card:null as any,
    map: null as any,
    story: null as any,

  });

  // ❌ REMOVED - CAUSES DUPLICATE USER MESSAGES
  // saveUserMessageApi()

  const [chatInput, setChatInput] = useState("");

  const {
    messages,
    sendMessage: chatSendMessage,
    status,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chatwithshopify",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          messages,
          id,
          chatUuid,
          chatId: chatUuid,
          settings: {
            model: aiApis[selectedModelIdx]?.model,
            site_url: apis[selectedApiIdx]?.site_url,
          },
        },
      }),
    }),

    onFinish: async (finishEvent: any) => {
      // AI SDK passes { message, messages, isAbort, isError, finishReason }
      // The actual assistant message is inside finishEvent.message
      const msg = finishEvent.message ?? finishEvent;

      if (msg.role === "assistant") {
        // Extract text from parts array
        const textParts = (msg.parts ?? [])
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("\n\n");

        // Extract card/chart/table/map from tool-call parts
        for (const part of msg.parts ?? []) {
          const toolType = part.type ?? "";

          // Tool parts have type like "tool-createCard", "tool-createChart", etc.
          if (toolType.includes("createCard") && part.input) {
            const cardMsg = { type: "card", data: part.input };
            if (!assistantBundleRef.current.card) {
              assistantBundleRef.current.card = cardMsg;
              onNewMessage?.("assistant", cardMsg);
            }
          }

          if (toolType.includes("createChart") && part.input) {
            const chartMsg = { type: "chart", data: part.input };
            if (!assistantBundleRef.current.chart) {
              assistantBundleRef.current.chart = chartMsg;
              onNewMessage?.("assistant", chartMsg);
            }
          }

          if (toolType.includes("createTable") && part.input) {
            const tableMsg = { type: "table", data: part.input };
            if (!assistantBundleRef.current.table) {
              assistantBundleRef.current.table = tableMsg;
              onNewMessage?.("assistant", tableMsg);
            }
          }

          if (toolType.includes("createMap") && part.input) {
            const mapMsg = { type: "map", data: { title: part.input.title, points: part.input.points } };
            if (!assistantBundleRef.current.map) {
              assistantBundleRef.current.map = mapMsg;
              onNewMessage?.("assistant", mapMsg);
            }
          }
        }

        // Send story/text as the final message
        if (textParts) {
          const storyMsg = { type: "story", content: textParts };
          onNewMessage?.("assistant", storyMsg);
        }

        // Reset bundle AFTER all messages have been sent
        assistantBundleRef.current = {
          chart: null,
          table: null,
          card: null,
          map: null,
          story: null,
        };
      }

      setIsLoading?.(false);
    },

    onError(err) {
      console.error("Chat error:", err);
      setErrorMessage(err?.message || "Something went wrong.");
      setIsLoading?.(false);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const input = chatInput;
  const handleInputChange = (e: any) => setChatInput(e.target?.value ?? e);

  // mic input support
  useEffect(() => {
    if (transcript) {
      setChatInput(transcript);
    }
  }, [transcript]);

  // load model/API options
  useEffect(() => {
    fetch("/api/chatwithshopify/aiapis")
      .then((res) => res.json())
      .then((data) => setAiApis(Array.isArray(data) ? data : []));

    fetch("/api/chatwithshopify/apis")
      .then((res) => res.json())
      .then((data) => setApis(Array.isArray(data) ? data : []));
  }, []);

  // ✔ FIXED sendMessage (NO DB INSERT HERE)
  const sendMessage = async () => {
    if (!input.trim()) return;

    setIsLoading?.(true);
    resetTranscript();

    // UI update
    onNewMessage?.("user", input);

    try {
      chatSendMessage({ text: input });
      setChatInput("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // auto-grow textarea
  useEffect(() => {
    const tx = textareaRef.current;
    if (!tx) return;
    tx.style.height = "auto";
    tx.style.height = `${Math.min(tx.scrollHeight, 96)}px`;
  }, [input]);

  return (
    <div className="w-full sticky bottom-0 z-40 py-0.5">
      <div className="mx-auto w-full max-w-[800px]">
        <div className={cn(
            "rounded-xl border shadow-sm p-4 sm:p-4 flex flex-col gap-3 sm:gap-4",
            "bg-background"
          )}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => handleInputChange(e)}
            placeholder="Ask a question about your data..."
            className="flex w-full rounded-sm border border-input bg-background px-2  py-3 text-base leading-relaxed resize-none overflow-y-auto"
            style={{ maxHeight: 96 }}
          />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
                    <SlidersHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent  className="ml-2">
                  <DropdownMenuLabel>Select Model</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {aiApis.map((m, i) => (
                    <DropdownMenuItem key={i} onClick={() => setSelectedModelIdx(i)}>
                      {m.model}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-3 rounded-lg flex items-center gap-2"
                  >
                    <Wrench className="w-5 h-5" /> API
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent  className="ml-2">
                  <DropdownMenuLabel>Select API</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {apis.map((a, i) => (
                    <DropdownMenuItem key={i} onClick={() => setSelectedApiIdx(i)}>
                      {a.site_url}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-lg"
                onClick={() =>
                  listening
                    ? SpeechRecognition.stopListening()
                    : SpeechRecognition.startListening({ continuous: true })
                }
              >
                {listening ? <MicOff /> : <Mic />}
              </Button>

              <Button
                size="icon"
                variant="default"
                disabled={!input.trim() || isLoading}
                onClick={sendMessage}
                className="h-9 w-9 rounded-lg"
              >
                <ArrowUp />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
