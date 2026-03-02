import React from "react";
import NewSettings from "../../../_components/NewSettings";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = await (await params).id;
  return (
    <div className="max-w-[800px] mx-auto">
      <NewSettings id={id} />
    </div>
  );
};

export default Page;
