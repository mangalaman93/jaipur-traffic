import React, { useMemo } from "react";
import { cn } from "@/lib/cn";
import { TrafficData } from "@/lib/types";
import { TrafficMapGrid } from "@/components/TrafficMapGrid";
import { TrafficLegend } from "@/components/TrafficLegend";
import {
  createCellKey,
  getTop10SeverityCells,
  getTop10TrafficCells,
} from "@/lib/gridUtils";
import { calculateTotalTraffic } from "@/lib/trafficUtils";

interface FullTrafficGridProps {
  data: TrafficData[];
  mode?: "traffic" | "severity";
  highlightTop10?: boolean;
  topAreasList?: React.ReactNode;
}

export function FullTrafficGrid({
  data,
  mode = "traffic",
  highlightTop10 = false,
  topAreasList,
}: FullTrafficGridProps) {
  // Computed values
  const dataMap = useMemo(() => {
    const map = new Map<string, TrafficData>();
    data.forEach((item) => {
      map.set(createCellKey(item.x, item.y), item);
    });
    return map;
  }, [data]);

  const top10Cells = useMemo(() => {
    if (!highlightTop10) return new Set<string>();
    return mode === "severity"
      ? getTop10SeverityCells(data)
      : getTop10TrafficCells(data);
  }, [data, highlightTop10, mode]);


  return (
    <>
      <div className="space-y-4">
        {/* Map and Top 10 side by side */}
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-6">
          {/* OpenStreetMap Grid */}
          <div className="rounded-lg overflow-hidden border border-border flex-shrink-0 w-full sm:w-[70%] h-[350px] sm:h-[900px]">
            <TrafficMapGrid
              data={data}
              mode={mode}
              highlightTop10={highlightTop10}
              top10Cells={top10Cells}
              onCellClick={() => {}}
            />
          </div>

          {/* Top 10 List */}
          <div className="flex-shrink-0 w-full sm:w-[30%]">
            {topAreasList || (
              <div className="bg-card rounded-lg border p-4 h-full">
                <h3 className="text-lg font-semibold mb-4">
                  {mode === "severity"
                    ? "Top 10 Severity Areas"
                    : "Top 10 Congested Areas"}
                </h3>
                <div className="space-y-2">
                  {Array.from(top10Cells)
                    .slice(0, 10)
                    .map((cellKey, index) => {
                      const [x, y] = cellKey.split("-").map(Number);
                      const cell = dataMap.get(cellKey);
                      if (!cell) return null;

                      return (
                        <div
                          key={cellKey}
                          className="flex items-center justify-between p-2 rounded border bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              #{index + 1}
                            </span>
                            <span className="text-sm">
                              Grid [{x}, {y}]
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {mode === "severity"
                              ? `Severity: ${cell.latest_severity?.toFixed(1) || "N/A"}`
                              : `Total: ${calculateTotalTraffic(cell)}`}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div
          className={cn(
            "flex flex-wrap items-center justify-center",
            "gap-3 sm:gap-6 mt-4 text-xs sm:text-sm",
          )}
        >
          <TrafficLegend mode={mode} />
        </div>
      </div>
    </>
  );
}
