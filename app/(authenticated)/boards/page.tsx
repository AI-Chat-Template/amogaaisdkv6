import React from "react";
import BoardsList from "./_components/BoardsList";
import { getRecords } from "./lib/queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boards",
  description: "Visual Representation of data in Charts and Cards",
};

const Page = async () => {
  const filteredData = await getRecords();

  return <BoardsList data={filteredData} />;
};

export default Page;
