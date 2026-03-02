import React from "react";
import NewSettingswoo from "../../../_components/NewSettingswoo";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = await (await params).id;
  return (
    <div className="max-w-[800px] mx-auto">
      <NewSettingswoo id={id} />
    </div>
  );
};

export default Page;
