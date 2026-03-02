/* eslint-disable @typescript-eslint/no-explicit-any */
import Files from "../../_components/Files";
import { Metadata } from "next";
import { getFiles } from "../../lib/queries";
import { FileData } from "../../types/types";

export const metadata: Metadata = {
  title: "Files",
  description: "View User Uploaded Files",
};

interface PageProps {
  params: Promise<{ context: string; subcontext: string }>;
}

const Page = async ({ params }: PageProps) => {
  const { context, subcontext } = await params;
  const filesResponse = await getFiles();

  // Filter files by folder_group and folder_name and map to FileData
  const fileData: FileData[] =
    (filesResponse || [])
      .filter(
        (file: any) =>
          file.folder_group === context && file.folder_name === subcontext
      )
      .map((file: any) => file) || [];

  return (
    <div className="h-full max-w-[800px] mx-auto p-4">
      <Files data={fileData} context={context} subContext={subcontext} />
    </div>
  );
};

export default Page;
