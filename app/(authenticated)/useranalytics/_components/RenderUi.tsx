/* eslint-disable @typescript-eslint/no-explicit-any */
import { PieChartRender } from "./Charts/PieChart";

const RenderUi = ({ data, json }: { data: any; json: any }) => {
  const chartType = json[0]?.charts[0]?.chartType;

  switch (chartType) {
    case "pie-chart":
      return <PieChartRender data={data} json={json} />;
    default:
      return;
  }
};

export default RenderUi;
