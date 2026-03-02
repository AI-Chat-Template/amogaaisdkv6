/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  Bot,
  Eye,
  Edit,
  Code,
  Calendar,
  Activity,
  CheckCircle2,
  File,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LuMessageCircleMore } from "react-icons/lu";

const BoardsList = ({ data }: { data: any }) => {
  const [search, setSearch] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex flex-col mt-5 max-w-[800px] mx-auto justify-center gap-4 w-full items-center">
      <div className="flex w-full gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Boards"
            className="pl-10 text-md"
          />
        </div>
        <Link href="/boardmaker/newBoard">
          <Button size={"icon"}>
            <Plus className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 w-full">
        {data.length > 0 &&
          data
            .filter((item: any) => {
              const searchTerm = search.toLowerCase();
              return item.form_name.toLowerCase().includes(searchTerm);
            })
            .map((item: any) => (
              <Card key={item.form_id} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    {/* Content Section */}
                    <div className="flex flex-col gap-4">
                      {/* Name */}

                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-xl">
                          {item.form_name}
                        </h2>
                        <Bot className="h-5 w-5 text-muted-foreground" />
                      </div>

                      {/* Code */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Code className="h-5 w-5" />
                        <span>Code: {item.form_code}</span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Status: </span>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </div>

                      {/* Created Date */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-5 w-5" />
                        <span>Created: {formatDate(item.created_date)}</span>
                      </div>

                      {/* Version and Actions in same line */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Activity className="h-5 w-5" />
                          <span>Version: {item.version_no}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <Link href={`/boards`}>
                            <File className="h-5 w-5 text-muted-foreground stroke-[1.5] cursor-pointer hover:text-foreground" />
                          </Link>
                          <ClipboardCheck className="h-5 w-5 text-muted-foreground stroke-[1.5] cursor-pointer hover:text-foreground" />
                          <Link href={`/boards`}>
                            <Edit className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                          </Link>
                          <Link href={`/boards/view/${item.form_id}`}>
                            <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                          </Link>

                          <Link href={`/boards`}>
                            <LuMessageCircleMore className="h-5 w-5 text-muted-foreground stroke-[1.5] cursor-pointer hover:text-foreground" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
};

export default BoardsList;
