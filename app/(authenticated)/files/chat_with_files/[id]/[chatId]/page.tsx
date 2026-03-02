import { Metadata } from "next";
import React from "react";
import { getFileData } from "../../../lib/queries";
import RenderChatFile from "../../../_components/RenderChatFile";

export const metadata: Metadata = {
  title: "Chat with Files",
  description: "Chat with Files using AI",
};

interface PageProps {
  params: Promise<{ id: number; chatId: string }>;
}

const Page = async ({ params }: PageProps) => {
  const { id, chatId } = await params;
  const fileData = await getFileData(id);

  return (
    <div className="max-w-[800px] mx-auto p-4">
      <RenderChatFile fileId={id} data={fileData} chatId={chatId} />
    </div>
  );
};

export default Page;
