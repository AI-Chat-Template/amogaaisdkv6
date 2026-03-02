import React, { Suspense } from "react";
import RenderDashboard from "./RenderDashboard";
import { FormData } from "../types/types";

const Dashboard = ({ data }: { data: FormData[] }) => {
  const content_json = data[0]?.content_json;
  const apiToken = data[0]?.api_connection_json;

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <RenderDashboard
          contentJson={content_json}
          data={data[0]}
          apiToken={apiToken}
        />
      </Suspense>
    </div>
  );
};

export default Dashboard;
