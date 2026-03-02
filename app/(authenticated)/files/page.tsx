import { Metadata } from "next";
import { getFiles } from "./lib/queries";
import Files from "./_components/Files";
import { FileMetadata } from "./types/types";

export const metadata: Metadata = {
  title: "Files",
  description: "View User Uploaded Files",
};

const Page = async () => {
  const files = await getFiles();
  // Extract unique folder groups from files
  const folderGroups = Array.from(
    new Set(files?.map((file: FileMetadata) => file.folder_group) || [])
  );

  return (
    <div className="h-full max-w-[800px] mx-auto p-4">
      <Files data={folderGroups} />
    </div>
  );
};

export default Page;
