/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";
import { FileData } from "../types/types";
import {
  ArrowUp,
  Bot,
  Copy,
  Edit,
  Eye,
  FileUp,
  History,
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Share2,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  addFavorite,
  addFeedback,
  createChat,
  createMessage,
  fetchMessages,
  getChatFavorites,
  getChatHistory,
} from "../lib/action";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import HistoryBar from "./sidebar/History";
import TokenUsage from "./TokenUsage";
import FavoritesBar from "./sidebar/Favorites";

interface ChatFileProps {
  data: FileData;
  isContentLoading: boolean;
  fileContent: string;
  chatId?: string;
  fileId?: number;
}

const ChatFiles = ({
  data,
  isContentLoading,
  fileContent,
  chatId,
  fileId,
}: ChatFileProps) => {
  const [prompt, setPrompt] = React.useState("");
  const [messages, setMessages] = React.useState<any[]>([]);
  const [isResponseLoading, setIsResponseLoading] = React.useState(false);
  const [openHistory, setOpenHistory] = React.useState(false);
  const [openFavorite, setOpenFavorite] = React.useState(false);
  const [historyData, setHistoryData] = React.useState<any[]>([]);
  const [favoriteData, setFavoriteData] = React.useState<any[]>([]);
  const [tokenUsage, setTokenUsage] = React.useState({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  });
  const { data: session } = useSession();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getChatHistory();
        setHistoryData(response);
      } catch (error) {
        toast.error("Error fetching history");
        throw error;
      }
    };
    fetchHistory();
  }, [openHistory]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await getChatFavorites();
        setFavoriteData(response);
      } catch (error) {
        toast.error("Error fetching favorites");
        throw error;
      }
    };
    fetchFavorites();
  }, [openFavorite]);

  useEffect(() => {
    if (chatId) {
      const renderMessages = async () => {
        const response = await fetchMessages(chatId);

        if (!response) {
          toast("Failed to fetch messages");
          return;
        }
        const sortedData = response.sort((a: any, b: any) => {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
        setMessages(
          sortedData.map((msg: any) => ({
            id: msg.id,
            chatId: msg.chatId,
            createdAt: msg.createdAt,
            bookmark: msg.bookmark,
            isLike: msg.isLike,
            favorite: msg.favorite,
            text: msg.content,
            role: msg.role,
          }))
        );
      };
      renderMessages();
    }
  }, [chatId]);

  useEffect(() => {
    if (messages.length > 0) {
      // Sort messages by createdAt timestamp (note: your data uses createdAt, not created_at)
      const sortedMessages = [...messages].sort((a, b) => {
        // If createdAt is available, use it for sorting
        if (a.createdAt && b.createdAt) {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        // Fallback to id if available
        if (a.id && b.id) {
          return a.id - b.id;
        }
        // If no reliable sorting field is available, maintain current order
        return 0;
      });

      // Only update if the order has changed
      if (
        JSON.stringify(sortedMessages.map((m) => m.id)) !==
        JSON.stringify(messages.map((m) => m.id))
      ) {
        setMessages(sortedMessages);
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt || !fileContent) return null;

    setIsResponseLoading(true);
    try {
      const newChatUuid = uuidv4();
      const userMsgId = uuidv4();
      const assistantMsgId = uuidv4();
      const currentChatId = chatId || newChatUuid;
      const createdDate = new Date().toISOString();
      if (!chatId) {
        const payload = {
          createdAt: createdDate,
          user_id: session?.user?.user_catalog_id,
          id: newChatUuid,
          title: prompt,
          status: "active",
          doc_id: data?.data?.file_upload_id,
          chat_group: "Chat with File",
        };
        const createChatData = await createChat(payload);
        if (!createChatData.success) {
          toast.error("Error creating chat");
        }
      }

      const userMessage = {
        id: userMsgId,
        chatId: currentChatId,
        content: prompt,
        text: prompt,
        role: "user",
        createdAt: createdDate,
        user_id: session?.user?.user_catalog_id,
        bookmark: null,
        isLike: null,
        favorite: null,
      };

      setMessages((prev) => [...prev, userMessage]);

      const messagePayload = {
        id: userMsgId,
        chatId: currentChatId,
        content: prompt,
        role: "user",
        createdAt: createdDate,
        user_id: session?.user?.user_catalog_id,
      };
      await createMessage(messagePayload);

      const assistantMsg = {
        id: assistantMsgId,
        chatId: currentChatId,
        content: "",
        role: "assistant",
        createdAt: createdDate,
        user_id: session?.user?.user_catalog_id,
        bookmark: null,
        isLike: null,
        favorite: null,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      try {
        const response = await fetch("/api/files/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Here is the file content:\n${fileContent}`,
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        });

        if (!response.body) {
          toast.error("No response body from AI");
          setIsResponseLoading(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let done = false;
        let buffer = "";
        let aiResponse = "";

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();

            if (line.startsWith("data:")) {
              const dataStr = line.replace(/^data:\s*/, "");

              if (dataStr === "[DONE]") {
                done = true;
                break;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta;
                if (delta && delta.content) {
                  aiResponse += delta.content;

                  // Update the assistant message incrementally
                  setMessages((prev) => {
                    const messages = [...prev];
                    if (
                      messages.length > 0 &&
                      messages[messages.length - 1].role === "assistant"
                    ) {
                      messages[messages.length - 1].text = aiResponse;
                      messages[messages.length - 1].content = aiResponse; // Update both fields
                    }
                    return messages;
                  });
                }
                setTokenUsage({
                  promptTokens: parsed.usage?.prompt_tokens,
                  completionTokens: parsed.usage?.completion_tokens,
                  totalTokens: parsed.usage?.total_tokens,
                });
              } catch (err) {
                console.error("Error parsing SSE data:", err);
              }
            }
          }

          buffer = lines[lines.length - 1];
        }

        await createMessage({
          id: assistantMsgId,
          chatId: currentChatId,
          content: aiResponse,
          role: "assistant",
          createdAt: new Date().toISOString(),
          user_id: session?.user?.user_catalog_id,
        });
      } catch (error) {
        toast.error("Failed fetching response");
        throw error;
      }
      if (!chatId) {
        router.push(`/files/chat_with_files/${fileId}/${currentChatId}`);
      }
      setIsResponseLoading(false);

      setPrompt("");
    } catch (error) {
      setIsResponseLoading(false);

      throw error;
    }
  };

  const handleFavorite = async (message) => {
    const newFavoriteStatus = !message.favorite;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === message.id ? { ...msg, favorite: newFavoriteStatus } : msg
      )
    );
    const favorite = await addFavorite(message.id);

    if (!favorite.success) {
      toast.error("Error adding favorite");
    }
  };

  const handleLike = async (message, isLike: boolean) => {
    const newLikeStatus = message.isLike === isLike ? null : isLike;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === message.id ? { ...msg, isLike: newLikeStatus } : msg
      )
    );
    const feedback = await addFeedback(message.id, newLikeStatus);

    if (!feedback.success) {
      toast.error("Error adding favorite");
    }
  };

  return (
    <div className="mt-5">
      <div className="w-full flex justify-between">
        <div className="flex items-center gap-2.5">
          <Bot className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Chat with Files</h1>
          <div>
            <TokenUsage tokenUsage={tokenUsage} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Plus className="h-5 w-5 text-muted-foreground" />
          <History
            onClick={() => setOpenHistory(true)}
            className="h-5 cursor-pointer w-5 text-muted-foreground"
          />
          <Star
            onClick={() => setOpenFavorite(true)}
            className="h-5 w-5 cursor-pointer text-muted-foreground"
          />
          <Menu className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <HistoryBar
        open={openHistory}
        data={historyData}
        title=""
        fileId={fileId}
        setOpen={setOpenHistory}
      />
      <FavoritesBar
        open={openFavorite}
        data={favoriteData}
        title=""
        fileId={fileId}
        setOpen={setOpenFavorite}
      />
      <ScrollArea
        ref={scrollAreaRef}
        className="h-[calc(70vh-100px)] w-full relative"
      >
        <div className="flex flex-col gap-4 w-full md:p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className="flex items-center gap-2 w-full justify-start "
            >
              <div className="flex bg-secondary rounded-full h-10 w-10 flex-col items-center justify-center">
                {message.role === "user" ? (
                  <p className="flex flex-col items-center justify-center">
                    {session?.user?.user_name?.[0].toUpperCase()}
                  </p>
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col w-full gap-2">
                <div
                  className={` rounded-t-md rounded-l-lg p-3 ${
                    message.role === "user" ? "bg-muted" : "bg-muted"
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    // className="prose prose-td:border prose-td:border-gray-300 prose-td:pl-2"
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>
                <div>
                  {message.role === "assistant" && (
                    <div className="flex  md:ml-3 items-center gap-5">
                      <div className="flex items-center gap-5">
                        <Eye className="w-5 h-5 cursor-pointer text-muted-foreground" />
                        <Star
                          className={`w-5 h-5 cursor-pointer text-muted-foreground ${
                            message.favorite ? "fill-primary text-primary" : ""
                          }`}
                          onClick={() => handleFavorite(message)}
                        />
                        <Copy
                          onClick={() => {
                            navigator.clipboard.writeText(message.text);
                            toast.success("Copied to clipboard");
                          }}
                          className="w-5 h-5 cursor-pointer text-muted-foreground"
                        />
                        <RefreshCw className="w-5 h-5 cursor-pointer text-muted-foreground" />
                        <Share2 className="w-5 h-5 cursor-pointer text-muted-foreground" />
                        <Edit className="w-5 h-5 cursor-pointer text-muted-foreground" />
                      </div>
                      <div className="flex items-center  gap-5 justify-end w-full">
                        <ThumbsUp
                          onClick={() => handleLike(message, true)}
                          className={`w-5 h-5 ${
                            message.isLike === true &&
                            "fill-primary text-primary"
                          } cursor-pointer text-muted-foreground`}
                        />
                        <ThumbsDown
                          onClick={() => handleLike(message, false)}
                          className={`w-5 h-5 ${
                            message.isLike === false &&
                            "fill-primary text-primary"
                          } cursor-pointer text-muted-foreground`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit}>
        <div className="rounded-full flex items-center p-2.5 border">
          <Input
            placeholder="Type your message here"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="border-0"
          />
          <div className="flex items-center gap-4">
            <FileUp className="w-5 h-5 cursor-not-allowed text-muted-foreground" />
            <Button
              disabled={isContentLoading || isResponseLoading || !prompt}
              size={"icon"}
              className="rounded-full"
            >
              {isResponseLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5 " />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

const ChatwithFiles = React.memo(ChatFiles);

export default ChatwithFiles;
