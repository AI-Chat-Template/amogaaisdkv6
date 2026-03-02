/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Archive,
  Bookmark,
  Clock,
  MessageSquare,
  X,
  Trash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  getChatHistory,
  deleteChat,
  toggleBookmark,
} from "@/app/(authenticated)/chatwithwoodata/actions";
import { v4 as uuidv4 } from "uuid";

export default function ChatHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ------------------------------------------------------------
  // 🔥 Fetch chat history (NO parameters — fixed)
  // ------------------------------------------------------------
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res: any = await getChatHistory(); // FIXED HERE
      setChats(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch chat history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ------------------------------------------------------------
  // 🔥 Delete chat
  // ------------------------------------------------------------
  const handleDelete = async (id: string) => {
    try {
      const res = await deleteChat(id);
      if (res.success) {
        toast.success("Chat deleted successfully");
        setChats((prev) => prev.filter((chat) => chat.id !== id));
      } else {
        toast.error("Failed to delete chat");
      }
    } catch (error) {
      toast.error("Error deleting chat");
    }
  };

  // ------------------------------------------------------------
  // 🔥 Toggle Bookmark
  // ------------------------------------------------------------
  const handleBookmark = async (chatId: string, current: boolean) => {
    try {
      const newStatus = !current;

      // Optimistic UI update
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, bookmark: newStatus } : chat
        )
      );

      const res = await toggleBookmark(chatId, newStatus);

      if (!res.success) {
        toast.error("Failed to update bookmark");

        // revert UI
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, bookmark: current } : chat
          )
        );
      } else {
        toast.success(
          newStatus
            ? "Chat bookmarked successfully"
            : "Bookmark removed successfully"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Error toggling bookmark");
    }
  };

  // ------------------------------------------------------------
  // 🔥 Filter + Search
  // ------------------------------------------------------------
  const filteredChats = chats
    .filter((chat) =>
      chat.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((chat) => {
      if (filter === "bookmarked") return chat.bookmark === true;
      if (filter === "archived") return chat.status === "archived";
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  // ------------------------------------------------------------
  // 🔥 New Chat Navigation
  // ------------------------------------------------------------
  const handleNewChat = () => {
    const newChatId = uuidv4();
    router.push(`/chatwithwoodata/${newChatId}`);
  };

  return (
    <div className="flex flex-col  w-full max-w-[800px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="default" onClick={handleNewChat} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          New Chat
        </Button>

        <Button variant="default" onClick={() => history.back()}>
          <X className="h-5 w-5 mr-1" />
          Close
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-2.5 h-4 w-4 opacity-60" />
        <Input
          placeholder="Search chat history..."
          className="pl-9 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex gap-3 justify-start flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className="gap-2"
        >
          All Chats
        </Button>

        <Button
          variant={filter === "bookmarked" ? "default" : "outline"}
          onClick={() => setFilter("bookmarked")}
          className="gap-2"
        >
          <Bookmark className="h-4 w-4" />
          Bookmarked
        </Button>

        <Button
          variant={filter === "archived" ? "default" : "outline"}
          onClick={() => setFilter("archived")}
          className="gap-2"
        >
          <Archive className="h-4 w-4" />
          Archived
        </Button>
      </div>

      {/* Chat Cards */}
      <div className="min-h-[300px] flex flex-col gap-4 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center justify-center h-[300px] opacity-70">
            Loading...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] opacity-70">
            No chats found.
          </div>
        ) : (
          filteredChats.map((chat) => (
            <Card
              key={chat.id}
              className="p-5 rounded-xl hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-semibold">
                    U
                  </div>
                  <div>
                    <div className="font-medium text-base line-clamp-2">
                      {chat.title || "Untitled Chat"}
                    </div>
                    <div className="text-sm flex items-center gap-1 opacity-70">
                      <Clock className="h-4 w-4" />
                      {new Date(chat.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <Bookmark
                  onClick={() => handleBookmark(chat.id, chat.bookmark)}
                  className={`h-5 w-5 cursor-pointer transition ${
                    chat.bookmark
                      ? "fill-primary text-primary"
                      : "opacity-60 hover:text-primary"
                  }`}
                />
              </div>

              {/* Token Info */}
              <div className="mt-3 text-sm opacity-80">
                <p>
                  <strong>Thread ID:</strong> {chat.id}
                </p>
                <p>
                  <strong>Token Use:</strong> Prompt:{" "}
                  {chat.promptTokens ?? 0}, Completion:{" "}
                  {chat.completionTokens ?? 0}, Total:{" "}
                  {chat.totalTokens ?? 0}, Cost: ${chat.cost ?? "0.00"}
                </p>
              </div>

              {/* Footer */}
              <div className="flex justify-end items-center mt-4 border-t pt-3 gap-3">
                <Trash
                  onClick={() => handleDelete(chat.id)}
                  className="h-5 w-5 opacity-60 hover:text-destructive cursor-pointer"
                />

                <Button size="sm" variant="default" asChild>
                  <Link href={`/chatwithwoodata/${chat.id}`}>Open Chat</Link>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
