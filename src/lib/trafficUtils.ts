import { TrafficData } from "./types";

export function calculateSeverityLevel(
  cell: TrafficData | null | undefined,
): "high" | "moderate" | "normal" {
  if (!cell?.latest_severity || !cell?.p95 || !cell?.p99) return "normal";

  // Handle case when all values are 0
  if (cell.latest_severity === 0 && cell.p95 === 0 && cell.p99 === 0)
    return "normal";

  if (cell.latest_severity > cell.p99) return "high";
  if (cell.latest_severity > cell.p95) return "moderate";
  return "normal";
}

export function calculateSeverityDifferences(
  cell: TrafficData | null | undefined,
) {
  if (!cell?.latest_severity || !cell?.p95 || !cell?.p99) {
    return { p95Diff: 0, p99Diff: 0 };
  }

  const p95Diff = cell.latest_severity - cell.p95;
  const p99Diff = cell.latest_severity - cell.p99;

  return { p95Diff, p99Diff };
}

export function calculateTotalTraffic(cell: TrafficData): number {
  return cell.yellow + cell.red + cell.dark_red;
}

export function getTrafficSeverityLevel(
  cell: TrafficData,
): "critical" | "high" | "medium" | "normal" {
  const total = calculateTotalTraffic(cell);
  if (total === 0) return "normal";
  if (cell.dark_red > 0) return "critical";
  if (cell.red > 0) return "high";
  return "medium";
}
