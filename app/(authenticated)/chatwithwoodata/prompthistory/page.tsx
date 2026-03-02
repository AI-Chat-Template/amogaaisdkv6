/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Clock,
  Trash,
  X,
  Heart,
  Star,
  Flag,
  Archive,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

import {
  getPromptHistory,
  deletePrompt,
} from "@/app/(authenticated)/chatwithwoodata/actions";

export default function PromptHistoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await getPromptHistory();
    setPrompts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (uuid: string) => {
    const res = await deletePrompt(uuid);
    if (res.success) {
      toast.success("Prompt deleted");
      setPrompts((prev) => prev.filter((p) => p.promptUuid !== uuid));
    } else {
      toast.error("Failed to delete");
    }
  };

  // Filtering & Search
  const filtered = prompts
    .filter((p) => p.title?.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => {
      if (filter === "favorite") return p.favorite === true;
      if (filter === "important") return p.important === true;
      if (filter === "action") return p.action_item === true;
      if (filter === "archived") return p.archive_status === true;
      return true;
    });

  return (
    <div className="flex flex-col w-full max-w-[800px] mx-auto  md:px-0 animate-fade-in">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Prompt History</h1>
        <Button variant="outline" onClick={() => history.back()}>
          <X className="h-5 w-5 mr-1" />
          Close
        </Button>
      </div>

      {/* SEARCH INPUT */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-2.5 h-4 w-4 opacity-60" />
        <Input
          placeholder="Search prompt history..."
          className="pl-9 py-5 rounded-lg text-base"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "all", label: "All Prompts" },
          { key: "favorite", label: "Favorite", icon: Heart },
          { key: "important", label: "Important", icon: Star },
          { key: "action", label: "Action Items", icon: Flag },
          { key: "archived", label: "Archived", icon: Archive },
        ].map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
            className="flex items-center gap-1"
          >
            {f.icon && <f.icon className="h-4 w-4" />}
            {f.label}
          </Button>
        ))}
      </div>

      {/* LIST SECTION */}
      <div className="min-h-[350px] flex flex-col gap-4 pb-10">
        {loading ? (
          <div className="flex justify-center items-center opacity-70">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-[300px] opacity-70">
            <RotateCcw className="h-10 w-10 mb-3" />
            <div className="text-lg font-medium">No messages found</div>
            <div className="text-sm">No messages match the selected filter</div>
          </div>
        ) : (
          filtered.map((item) => (
            <Card
              key={item.promptUuid}
              className="p-5 flex flex-col gap-3 rounded-xl shadow-sm border"
            >
              {/* Chat Title */}
              <div className="text-lg font-semibold text-primary leading-tight">
                {item.chatTitle || "Untitled Chat"}
              </div>

              {/* Prompt Title */}
              <div className="text-base text-gray-800 truncate">
                {item.title || "No Title"}
              </div>

              {/* Token Use */}
              <div className="text-xs opacity-80">
                <span className="font-semibold">Token Use:</span>{" "}
                Prompt: {item.promptTokens ?? 0},{" "}
                Completion: {item.completionTokens ?? 0},{" "}
                Total: {item.totalTokens ?? 0},{" "}
                Cost: ${Number(item.cost).toFixed(6)}
              </div>

              {/* Date */}
              <div className="text-sm flex items-center gap-1 opacity-70">
                <Clock className="h-4 w-4" />
                {new Date(item.createdAt).toLocaleString()}
              </div>

              {/* Delete Button */}
              <div className="flex justify-end border-t pt-3">
                <Trash
                  className="h-5 w-5 cursor-pointer opacity-70 hover:text-red-500 hover:opacity-100 transition"
                  onClick={() => handleDelete(item.promptUuid)}
                />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
