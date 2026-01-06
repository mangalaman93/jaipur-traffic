import { TrafficData } from "./types";
import {
  calculateSeverityDifferences,
  calculateTotalTraffic,
} from "./trafficUtils";

export const createCellKey = (x: number, y: number): string => `${x}-${y}`;

export const createDefaultCell = (x: number, y: number): TrafficData => ({
  x,
  y,
  yellow: 0,
  red: 0,
  dark_red: 0,
  latest_severity: 0,
  p95: 0,
  p99: 0,
  threshold_p95: 0,
  ts: null,
});

export const getTop10SeverityCells = (data: TrafficData[]): Set<string> => {
  const processedData = data
    .filter((cell) => cell.latest_severity && cell.p95 && cell.p99)
    .map((cell) => {
      const { p95Diff, p99Diff } = calculateSeverityDifferences(cell);
      return { ...cell, p95Diff, p99Diff };
    });

  const p99Cells = processedData
    .filter((cell) => cell.p99Diff > 0)
    .sort((a, b) => b.p99Diff - a.p99Diff)
    .slice(0, 10);

  if (p99Cells.length >= 10) {
    return new Set(p99Cells.map((cell) => createCellKey(cell.x, cell.y)));
  }

  const p95Cells = processedData
    .filter((cell) => cell.p95Diff > 0 && cell.p99Diff <= 0)
    .sort((a, b) => b.p95Diff - a.p95Diff)
    .slice(0, 10 - p99Cells.length);

  return new Set(
    [...p99Cells, ...p95Cells].map((cell) => createCellKey(cell.x, cell.y)),
  );
};

export const getTop10TrafficCells = (data: TrafficData[]): Set<string> => {
  const sortedData = data
    .filter((cell) => calculateTotalTraffic(cell) > 0)
    .sort((a, b) => calculateTotalTraffic(b) - calculateTotalTraffic(a))
    .slice(0, 10);

  return new Set(sortedData.map((cell) => createCellKey(cell.x, cell.y)));
};
