"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { FileData } from "../types/types";
import {
  ArrowLeft,
  ChevronRight,
  EllipsisVertical,
  File,
  FileImage,
  FilesIcon,
  FileText,
  Folder,
  LayoutGrid,
  LayoutList,
  MessageCircle,
  Search,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

interface FilesProps {
  data: FileData[] | string[];
  context?: string;
  subContext?: string;
}

const Files = ({ data, context, subContext }: FilesProps) => {
  const router = useRouter();
  const [layout, setLayout] = React.useState("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const pathname = usePathname();

  const displayData = React.useMemo(() => {
    if (!context) {
      return data as string[];
    } else if (!subContext) {
      return data as string[];
    } else {
      return data as FileData[];
    }
  }, [data, context, subContext]);

  const filteredData = React.useMemo(() => {
    if (!context || !subContext) {
      const items = displayData as string[];
      return items.filter((item) =>
        item?.toLowerCase().includes(searchQuery?.toLowerCase())
      );
    } else {
      const files = displayData as FileData[];
      return files.filter((item) =>
        item?.file_name?.toLowerCase().includes(searchQuery?.toLowerCase())
      );
    }
  }, [displayData, searchQuery, context, subContext]);

  const handleClick = (item: string | FileData) => {
    if (!context) {
      router.push(`/files/${item}`);
    } else if (!subContext) {
      router.push(`/files/${context}/${item}`);
    }
  };

  const renderFileIcon = (item: string | FileData) => {
    if (!context || !subContext) {
      return <Folder className="w-5 h-5" />;
    }

    const fileData = item as FileData;
    const extension = fileData?.file_name.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "png":
      case "jpg":
      case "jpeg":
        return <FileImage className="w-5 h-5" />;
      case "pdf":
        return <FileText className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const handleLayout = (layout: string) => {
    setLayout(layout);
  };

  const getFormattedPath = () => {
    const paths = pathname.split("/").filter(Boolean);
    if (paths.length === 0) return "Files";

    return (
      <div className="flex items-center">
        {paths.map((path, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="h-5 w-5 mx-2 text-muted-foreground" />
            )}
            <span
              className={`${
                index === paths.length - 1 ? "font-semibold" : ""
              } capitalize`}
            >
              {decodeURIComponent(path)}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const handleChatwithFile = async (item: FileData) => {
    router.push(`/files/chat_with_files/${item.file_upload_id}`);
  };

  return (
    <div className="flex flex-col  h-full items-center justify-center gap-5">
      <Card
        className={`w-full rounded-sm ${
          layout === "list" && " max-h-[70%] overflow-y-scroll"
        }`}
      >
        <CardHeader className="border-b">
          <div className="flex justify-between w-full">
            <div className="flex items-center gap-4">
              <FilesIcon className="h-5 w-5" />
              <span className="text-muted-foreground">|</span>
              <span className="font-semibold text-lg">
                {getFormattedPath()}
              </span>
            </div>
            <div className="flex items-center">
              {(context || subContext) && (
                <Button
                  variant="outline"
                  className="ml-2 md:ml-0"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden md:block">Back to Files</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-3 flex items-center gap-2.5 w-full">
            <div className="flex items-center w-full rounded border">
              <Search className="w-5 h-5 ml-3 text-muted-foreground" />
              <Input
                placeholder="Search files and folders..."
                className="border-none"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="icon"
                className={`${layout === "grid" && "bg-secondary"}`}
                onClick={() => handleLayout("grid")}
              >
                <LayoutGrid className="w-5 h-5 cursor-pointer" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`${layout === "list" && "bg-secondary"}`}
                onClick={() => handleLayout("list")}
              >
                <LayoutList className="w-5 h-5 cursor-pointer" />
              </Button>
            </div>
          </div>

          <div
            className={`${
              layout === "grid"
                ? "grid grid-cols-1 md:grid-cols-3 gap-5"
                : "flex flex-col gap-5"
            }`}
          >
            {filteredData.map((item, index) => (
              <Card
                key={index}
                className="cursor-pointer text-ellipsis truncate relative rounded-sm p-2.5"
              >
                <CardContent className="flex items-center gap-4">
                  <div
                    className="flex gap-2.5 items-center flex-1"
                    onClick={() => handleClick(item)}
                  >
                    <div className="bg-secondary p-2.5 rounded">
                      {renderFileIcon(item)}
                    </div>
                    <span className="text-lg font-semibold line-clamp-2">
                      {!context || !subContext
                        ? (item as string)
                        : (item as FileData).file_name}
                    </span>
                  </div>
                  {context && subContext && (
                    <div className="flex absolute right-0 bottom-0 p-2 gap-2.5">
                      <MessageCircle
                        className="w-5 h-5 cursor-pointer"
                        onClick={() => handleChatwithFile(item as FileData)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <EllipsisVertical className="h-5 w-5 cursor-pointer" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Chat</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Share</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {filteredData.length === 0 && <h1>No files found</h1>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Files;
