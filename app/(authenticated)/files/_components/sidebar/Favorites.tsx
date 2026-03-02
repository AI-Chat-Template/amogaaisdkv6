/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Search, Star, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";

import { useState } from "react";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: any;
  title: string;
  fileId?: number;
  //   setDeleteHistory: (deleteHistory: boolean) => void;
  //   refreshHistory: () => any;
}

const FavoritesBar = ({ open, setOpen, data, title, fileId }: Props) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleClick = (id: string) => {
    router.push(`/files/chat_with_files/${fileId}/${id}`);
  };

  // Filter data based on search term
  const filteredData =
    data &&
    data?.filter((item: any) =>
      item.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div>
      <Sheet open={open} onOpenChange={(open) => setOpen(open ? true : false)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Favorites</SheetTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${title.toLowerCase()}...`}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </SheetHeader>
          <div className="flex flex-col gap-2.5 mt-4">
            {filteredData.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                {searchTerm
                  ? "No matching items found"
                  : filteredData.length === 0
                  ? "No history found"
                  : "No items to display"}
              </div>
            ) : (
              filteredData.map((prompt: any) => (
                <div
                  key={prompt.id}
                  className="hover:bg-secondary border cursor-pointer p-2.5 rounded-md"
                >
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex justify-between  items-center gap-2">
                      <span
                        className="line-clamp-2"
                        onClick={() => handleClick(prompt.chatId)}
                      >
                        {prompt.content}
                      </span>
                    </div>
                    <Trash className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FavoritesBar;
