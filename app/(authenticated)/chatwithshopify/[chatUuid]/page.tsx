"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ChatHeader from "@/app/(authenticated)/chatwithshopify/_components/chat-header";
import ChatBody from "@/app/(authenticated)/chatwithshopify/_components/chat-body";
import ChatInput from "@/app/(authenticated)/chatwithshopify/_components/chat-input";

// ✅ Unified Message type (text, chart, table)
type Message = {
  role: "user" | "assistant" | "error";
  content:any;
};

export default function ChatPage() {
  const params = useParams();
  const chatUuid = params.chatUuid as string;

  // Chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // ✅ Load chat history from API
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchChat = async () => {
      try {
        setErrorMessage(null);

        const res = await fetch(
          `/api/chatwithshopify/loadchat?chatUuid=${chatUuid}`,
          { method: "GET" }
        );

        if (!res.ok) {
          setErrorMessage("Failed to load chat history.");
          return;
        }

        const data = await res.json();
       console .log(
  "MESSAGES FROM DB:",
  data.messages.map((m: any) => ({
    role: m.role,
    type: typeof m.content,
    content: m.content,
  }))
);
        // Expected from your backend:
        // data.messages: Message[]

        if (Array.isArray(data.messages)) {
          console.log("data messages: ",data.messages)
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Load chat error:", err);
        setErrorMessage("Unable to load chat. Please try again.");
      }
    };

    fetchChat();
  }, [chatUuid]);

  // ------------------------------------------------------------------
  // ✅ Append new incoming messages (streaming + visuals)
  // ------------------------------------------------------------------
const handleNewMessage = (
  role: "user" | "assistant",
  content: any
) =>  {
    setMessages((prev) => {
      const lastMsg = prev[prev.length - 1];

      // streaming text support
      if (
        role === "assistant" &&
        typeof content === "string" &&
        lastMsg?.role === "assistant" &&
        typeof lastMsg.content === "string"
      ) {
        const updated = [...prev];
        updated[updated.length - 1].content = content;
        return updated;
      }
      
      return [...prev, { role, content }];
    });
  };

  // ------------------------------------------------------------------
  // UI Layout
  // ------------------------------------------------------------------
  return (
    <main className="flex flex-col min-h-screen bg-background">
        <ChatHeader chatUuid={chatUuid} />

        <ChatBody
          chatUuid={chatUuid}
          messages={messages}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />

      <ChatInput
        chatUuid={chatUuid}
        onNewMessage={handleNewMessage}
        setIsLoading={setIsLoading}
         setErrorMessage={setErrorMessage}
      />
    </main>
  );
}
