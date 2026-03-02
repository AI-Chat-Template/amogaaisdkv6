import Files from "../_components/Files";
import { Metadata } from "next";
import { getFiles } from "../lib/queries";
import { FileData } from "@/types/files";

export const metadata: Metadata = {
  title: "Files",
  description: "View User Uploaded Files",
};

interface PageProps {
  params: Promise<{ context: string }>;
}

const Page = async ({ params }: PageProps) => {
  const { context } = await params;
  const files = await getFiles();

  const fileData: FileData[] = (files as FileData[]) || [];
  const folderNames = Array.from(
    new Set(
      fileData
        .filter((file) => file.folder_group === context)
        .map((file) => file.folder_name)
    )
  );

  return (
    <div className="h-full max-w-[800px] mx-auto p-4">
      <Files data={folderNames} context={context} />
    </div>
  );
};

export default Page;
