/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { getDataFromApi, getJsonFromPageList } from "./lib/queries";
import UserAnalytics from "./_components/UserAnalytics";

const Page = async () => {
  const pageList = await getJsonFromPageList();
  const board_json = pageList;
  const jsonData = board_json?.map((item) => item);

  const apiUrl = jsonData.map((item: any) =>
    item?.charts.map((item: any) => item.api)
  );
  const chartData = await getDataFromApi(apiUrl[0][0]);

  return (
    <div className="max-w-[800px] mx-auto p-4">
      <UserAnalytics data={chartData} json={jsonData} />
    </div>
  );
};

export default Page;
