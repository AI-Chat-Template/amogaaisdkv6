import React from "react";
import { getSingleRecord } from "../../lib/queries";
import Dashboard from "../../_components/Dashboard";
import { Metadata } from "next";
// import { FormData } from "../../types/types";

interface IndexPageProps {
  params: Promise<{ id: number }>;
}

export const metadata: Metadata = {
  title: "View Boards",
  description: "View data in Cards and Charts",
};

const Page = async (props: IndexPageProps) => {
  const params = await props.params;
  const data = await getSingleRecord(params.id);

  return (
    <div className="max-w-[800px] mx-auto p-4">
      <Dashboard data={data} />
    </div>
  );
};

export default Page;
