/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import RenderUi from "./RenderUi";

interface Props {
  data: any;
  json: any;
}

const UserAnalytics = ({ data, json }: Props) => {
  return (
    <div>
      <RenderUi data={data} json={json} />
    </div>
  );
};

export default UserAnalytics;
