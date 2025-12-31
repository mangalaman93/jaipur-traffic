import React from "react";
import { cn } from "@/lib/utils";
import { TrafficData } from "@/types/traffic";
import { calculateSeverityLevel } from "@/utils/trafficUtils";

interface GridCellProps {
  cell: TrafficData | undefined;
  col: number;
  row: number;
  mode: "traffic" | "severity";
  isTop10: boolean;
  top10Cells: Set<string>;
  onCellClick: (col: number, row: number) => void;
}

const getSeverity = (
  cell: TrafficData | undefined,
): "normal" | "yellow" | "red" | "darkRed" => {
  if (!cell) return "normal";
  if (cell.dark_red > 0) return "darkRed";
  if (cell.red > 0) return "red";
  if (cell.yellow > 0) return "yellow";
  return "normal";
};

const getSeverityStyles = (
  severity: "normal" | "yellow" | "red" | "darkRed",
) => {
  switch (severity) {
    case "darkRed":
      return "bg-traffic-dark-red/60 border-traffic-dark-red";
    case "red":
      return "bg-traffic-red/50 border-traffic-red";
    case "yellow":
      return "bg-traffic-yellow/40 border-traffic-yellow";
    default:
      return "bg-muted/20 border-border/50";
  }
};

const getSeverityLevelStyles = (level: "normal" | "moderate" | "high") => {
  switch (level) {
    case "high":
      return "bg-red-600/50 border-red-600";
    case "moderate":
      return "bg-yellow-600/40 border-yellow-600";
    default:
      return "bg-muted/20 border-border/50";
  }
};

export function GridCell({
  cell,
  col,
  row,
  mode,
  isTop10,
  top10Cells,
  onCellClick,
}: GridCellProps) {
  const cellKey = `${col}-${row}`;

  let isHighlighted = false;
  let styles = "";
  let title = `Grid [${col}, ${row}]`;

  if (mode === "severity") {
    const severityLevel = calculateSeverityLevel(cell);
    isHighlighted = severityLevel !== "normal" || isTop10;
    styles = getSeverityLevelStyles(severityLevel);
    if (cell) {
      title = `Grid [${col}, ${row}] - Severity: ${
        cell.latest_severity || "N/A"
      } (P95: ${cell.p95 || "N/A"}, P99: ${
        cell.p99 || "N/A"
      })${isTop10 ? " - TOP 10!" : ""}`;
    }
  } else {
    const severity = getSeverity(cell);
    isHighlighted = severity !== "normal" || isTop10;
    styles = getSeverityStyles(severity);
    if (cell) {
      title = `Grid [${col}, ${row}] - Y:${cell.yellow} R:${cell.red} DR:${cell.dark_red}${isTop10 ? " - TOP 10!" : ""}`;
    }
  }

  return (
    <button
      key={`cell-${col}-${row}`}
      onClick={() => onCellClick(col, row)}
      className={cn(
        "rounded-sm border transition-all duration-200 relative",
        "hover:scale-110 hover:z-10 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        styles,
        isTop10 && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        isHighlighted && "cursor-pointer",
      )}
      title={title}
    >
      {isTop10 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "bg-primary/90 text-primary-foreground",
              "rounded-full w-5 h-5",
              "flex items-center justify-center",
              "text-xs font-bold shadow-lg"
            )}
          >
            {Array.from(top10Cells).indexOf(cellKey) + 1}
          </div>
        </div>
      )}
    </button>
  );
}
