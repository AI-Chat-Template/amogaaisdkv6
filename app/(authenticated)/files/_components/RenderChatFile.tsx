"use client";
import React from "react";
import { FileData } from "../types/types";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, CopyCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ChatwithFiles from "./ChatwithFiles";
import { toast } from "sonner";

interface RenderChatFileProps extends FileData {
  chatId?: string;
  fileId?: number;
}

const RenderChatFile = ({ data, chatId, fileId }: RenderChatFileProps) => {
  const [fileContent, setFileContent] = React.useState("");
  const [isContentLoading, setIsContentLoading] = React.useState(false);

  React.useEffect(() => {
    const extractFileContent = async () => {
      if (!data?.file_publish_url || !data?.file_type) {
        toast.error("Missing file information");
        return;
      }
      setIsContentLoading(true);
      let fileType = data?.file_type;
      if (fileType === "others") {
        if (data?.file_name) {
          fileType = data?.file_name?.split(".").at(-1);
        }
      }
      try {
        let response;
        switch (fileType) {
          // case "pdf":
          //   response = await fetch("/api/files/extract-pdf", {
          //     method: "POST",
          //     headers: {
          //       "Content-Type": "application/json",
          //     },
          //     body: JSON.stringify({
          //       url: data?.file_publish_url,
          //     }),
          //   });
          //   break;
          case "csv":
            response = await fetch("/api/files/extract-csv", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: data?.file_publish_url,
              }),
            });
            break;
          case "xlsx":
            response = await fetch("/api/files/extract-xlsx", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: data?.file_publish_url,
              }),
            });
            break;
          case "docx":
            response = await fetch("/api/files/extract-docx", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: data?.file_publish_url,
              }),
            });
            break;
          // case "pptx":
          //   response = await fetch("/api/files/extract-pptx", {
          //     method: "POST",
          //     headers: {
          //       "Content-Type": "application/json",
          //     },
          //     body: JSON.stringify({
          //       url: data?.file_publish_url,
          //     }),
          //   });
          //   break;
          case "txt":
            response = await fetch("/api/files/extract-txt", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: data?.file_publish_url,
              }),
            });
            break;
          default:
            toast.error("Unsupported file type");
            throw new Error("Unsupported file type");
        }
        const content = await response.text();
        setFileContent(content);
        setIsContentLoading(false);
      } catch (error) {
        toast.error(`Error fetching File ${error}`);
        setIsContentLoading(false);
      }
    };
    extractFileContent();
  }, [data]);

  return (
    <div>
      <div className="flex justify-end items-center w-full mb-2">
        <Link href="/files">
          <Button variant={"outline"} className="flex items-center">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <span className="hidden md:block"> Back to Files</span>
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="p-2.5 space-y-2">
          <h1 className="font-medium">{data?.file_name}</h1>
          <p>Chat Group: {data?.folder_group}</p>
          <p>File Type: {data?.file_type}</p>
          <p className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-muted-foreground" />{" "}
            {data?.created_date}
          </p>
          <span className="flex items-center gap-2.5">
            <CopyCheck className="h-5 w-5 text-muted-foreground" />{" "}
            {data?.status}
          </span>
        </CardContent>
      </Card>
      <ChatwithFiles
        data={{ data }}
        fileContent={fileContent}
        isContentLoading={isContentLoading}
        chatId={chatId}
        fileId={fileId}
      />
    </div>
  );
};

export default RenderChatFile;
