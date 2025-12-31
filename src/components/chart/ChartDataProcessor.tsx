import { TrafficData } from "@/types/traffic";
import { parseISTTimestamp } from "@/utils/timeUtils";
import { calculateTotalTraffic } from "@/utils/trafficUtils";
import { MetricType, CHART_COLORS } from "./ChartConfig";

export function processChartData(data: TrafficData[]) {
  const sortedData = [...data].sort((a, b) => {
    const dateA = parseISTTimestamp(a.ts);
    const dateB = parseISTTimestamp(b.ts);
    return dateA.getTime() - dateB.getTime();
  });

  return sortedData.map((point) => {
    const timestamp = parseISTTimestamp(point.ts);
    const total = calculateTotalTraffic(point);

    return {
      timestamp,
      yellow: point.yellow,
      red: point.red,
      dark_red: point.dark_red,
      total,
      latest_severity:
        point.latest_severity ?? point.yellow + 2 * point.red + 3 * point.dark_red,
    };
  });
}

export function getChartLines(selectedMetric: MetricType) {
  const allLines = [
    { dataKey: "yellow", stroke: CHART_COLORS.yellow, name: "Yellow" },
    { dataKey: "red", stroke: CHART_COLORS.red, name: "Red" },
    { dataKey: "dark_red", stroke: CHART_COLORS.dark_red, name: "Dark Red" },
    { dataKey: "total", stroke: CHART_COLORS.total, name: "Total" },
    {
      dataKey: "latest_severity",
      stroke: CHART_COLORS.latest_severity,
      name: "Latest Severity",
    },
  ];

  if (selectedMetric === "all") {
    return allLines;
  }

  const line = allLines.find((l) => l.dataKey === selectedMetric);
  return [
    line || {
      dataKey: selectedMetric,
      stroke: CHART_COLORS.total,
      name: selectedMetric,
    },
  ];
}
