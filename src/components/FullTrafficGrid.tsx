import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { TrafficData } from "@/types/traffic";
import { parseISTTimestamp } from "@/utils/timeUtils";
import {
  getCellCenterCoordinates,
  getGoogleMapsUrl,
} from "@/utils/coordinateUtils";
import {
  calculateSeverityLevel,
  calculateSeverityDifferences,
  calculateTotalTraffic,
  getTrafficSeverityLevel,
} from "@/utils/trafficUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HistoricalChart } from "@/components/HistoricalChart";

interface FullTrafficGridProps {
  data: TrafficData[];
  rows?: number;
  cols?: number;
  mode?: "traffic" | "severity";
  highlightTop10?: boolean;
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

// Fixed row height for consistent layout without dynamic calc()
const ROW_HEIGHT = 53.3;
const GRID_ASPECT_RATIO = 12750 / 10920;

const useRowHeight = (
  containerRef: React.RefObject<HTMLDivElement>,
  rows: number,
) => {
  const [rowHeight, setRowHeight] = useState(ROW_HEIGHT);

  React.useEffect(() => {
    const updateRowHeight = () => {
      if (containerRef.current) {
        const { height } = containerRef.current.getBoundingClientRect();
        const calculatedRowHeight = height / rows;
        if (calculatedRowHeight > 0) {
          setRowHeight(calculatedRowHeight);
        }
      }
    };

    updateRowHeight();
    const resizeObserver = new ResizeObserver(updateRowHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [containerRef, rows]);

  return rowHeight;
};

export function FullTrafficGrid({
  data,
  rows = 21,
  cols = 15,
  mode = "traffic",
  highlightTop10 = false,
}: FullTrafficGridProps) {
  const [selectedCell, setSelectedCell] = useState<TrafficData | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>("24h");

  const DURATION_OPTIONS = {
    "1h": "1h",
    "6h": "6h",
    "12h": "12h",
    "24h": "24h",
    "7d": "7d",
  } as const;

  // Fetch historical data when a cell is selected
  const { data: historicalData, isLoading: isHistoricalLoading } = useQuery({
    queryKey: [
      "historicalData",
      selectedCoords?.x,
      selectedCoords?.y,
      selectedDuration,
    ],
    queryFn: async () => {
      if (!selectedCoords) return [];

      const url = `https://traffic-worker.mangalaman93.workers.dev/history?x=${selectedCoords.x}&y=${selectedCoords.y}&duration=${selectedDuration}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch historical data");
      }
      const data = await response.json();
      return data as TrafficData[];
    },
    enabled: !!selectedCoords,
  });

  const gridContainerRef = React.useRef<HTMLDivElement>(null);
  const rowHeight = useRowHeight(gridContainerRef, rows);

  // Memoize the data map to prevent recreation on every render
  const dataMap = useMemo(() => {
    const map = new Map<string, TrafficData>();
    data.forEach((item) => {
      map.set(`${item.x}-${item.y}`, item);
    });
    return map;
  }, [data]);

  // Memoize grid template styles to avoid recalculation
  const gridStyles = useMemo(
    () => ({
      headerGrid: { gridTemplateColumns: `repeat(${cols}, minmax(2rem, 1fr))` },
      mainGrid: { gridTemplateColumns: `repeat(${cols}, 1fr)` },
      aspectRatio: { aspectRatio: GRID_ASPECT_RATIO },
    }),
    [cols],
  );

  // Memoize Top 10 areas for highlighting based on mode
  const top10Cells = useMemo(() => {
    if (!highlightTop10) return new Set<string>();

    let sortedData;

    if (mode === "severity") {
      // For severity mode, prioritize P99 differences, fallback to P95
      sortedData = [...data]
        .filter((cell) => cell.latest_severity && cell.p95 && cell.p99)
        .map((cell) => {
          const { p95Diff, p99Diff } = calculateSeverityDifferences(cell);
          return { ...cell, p95Diff, p99Diff };
        });

      // First try to find cells with P99 differences
      const p99Cells = sortedData
        .filter((cell) => cell.p99Diff > 0)
        .sort((a, b) => b.p99Diff - a.p99Diff)
        .slice(0, 10);

      // If we have 10+ cells with P99 differences, use them
      if (p99Cells.length >= 10) {
        sortedData = p99Cells;
      } else {
        // Otherwise, use P95 differences for remaining slots
        const p95Cells = sortedData
          .filter((cell) => cell.p95Diff > 0 && cell.p99Diff <= 0)
          .sort((a, b) => b.p95Diff - a.p95Diff)
          .slice(0, 10 - p99Cells.length);

        sortedData = [...p99Cells, ...p95Cells].slice(0, 10);
      }
    } else {
      // For traffic mode, sort by total traffic counts
      sortedData = [...data]
        .filter((cell) => calculateTotalTraffic(cell) > 0)
        .sort((a, b) => calculateTotalTraffic(b) - calculateTotalTraffic(a))
        .slice(0, 10);
    }

    return new Set(sortedData.map((cell) => `${cell.x}-${cell.y}`));
  }, [data, highlightTop10, mode]);

  const handleCellClick = (x: number, y: number) => {
    const cell = dataMap.get(`${x}-${y}`);
    setSelectedCoords({ x, y });
    setSelectedCell(cell || null);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <div className="flex">
            {/* Row labels column */}
            <div className="flex flex-col">
              <div
                className="w-8 border border-border rounded-tl-lg flex items-center justify-center text-xs font-mono text-muted-foreground"
                style={{ height: rowHeight }}
              />
              {/* Empty corner - top-left rounded */}
              {Array.from({ length: rows }, (_, row) => (
                <div
                  key={`row-label-${row}`}
                  className={cn(
                    "flex items-center justify-center text-xs font-mono text-muted-foreground w-8 h-12 border-l border-b border-border",
                    row === rows - 1 &&
                      "border-l border-b border-r rounded-bl-lg",
                  )}
                  style={{ height: rowHeight }}
                >
                  {row}
                </div>
              ))}
            </div>

            {/* Header row with column numbers */}
            <div className="flex-1">
              <div className="border border-border overflow-hidden rounded-tr-lg">
                <div
                  className="grid gap-0 bg-card"
                  style={gridStyles.headerGrid}
                >
                  {Array.from({ length: cols }, (_, col) => (
                    <div
                      key={`header-${col}`}
                      className="flex items-center justify-center text-xs font-mono text-muted-foreground px-1 border border-border"
                      style={{ height: rowHeight }}
                    >
                      {col}
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid with background image and proper aspect ratio */}
              <div
                ref={gridContainerRef}
                className="relative bg-cover bg-center bg-no-repeat rounded-br-lg overflow-hidden border border-border border-t-0"
                style={{
                  backgroundImage: "url(/data/jaipur.jpg)",
                  ...gridStyles.aspectRatio,
                }}
              >
                <div
                  className="absolute inset-0 grid gap-1"
                  style={gridStyles.mainGrid}
                >
                  {Array.from({ length: rows }, (_, row) => (
                    <React.Fragment key={`row-${row}`}>
                      {/* Grid cells */}
                      {Array.from({ length: cols }, (_, col) => {
                        const cell = dataMap.get(`${col}-${row}`);

                        const cellKey = `${col}-${row}`;
                        const isTop10 =
                          highlightTop10 && top10Cells.has(cellKey);

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
                            onClick={() => handleCellClick(col, row)}
                            className={cn(
                              "rounded-sm border transition-all duration-200 relative",
                              "hover:scale-110 hover:z-10 hover:shadow-lg",
                              "focus:outline-none focus:ring-2 focus:ring-primary/50",
                              styles,
                              isTop10 &&
                                "ring-2 ring-primary ring-offset-1 ring-offset-background",
                              isHighlighted && "cursor-pointer",
                            )}
                            title={title}
                          >
                            {isTop10 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-primary/90 text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg">
                                  {Array.from(top10Cells).indexOf(cellKey) + 1}
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-xs sm:text-sm">
          {mode === "severity" ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-muted/20 border border-border/50" />
                <span className="text-muted-foreground">Normal (≤ P95)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-yellow-600/40 border border-yellow-600" />
                <span className="text-muted-foreground">
                  Moderate (&gt; P95, ≤ P99)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-red-600/50 border border-red-600" />
                <span className="text-muted-foreground">High (&gt; P99)</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-muted/20 border border-border/50" />
                <span className="text-muted-foreground">Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-traffic-yellow/40 border border-traffic-yellow" />
                <span className="text-muted-foreground">Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-traffic-red/50 border border-traffic-red" />
                <span className="text-muted-foreground">High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-traffic-dark-red/60 border border-traffic-dark-red" />
                <span className="text-muted-foreground">Critical</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialog for cell details */}
      <Dialog
        open={!!selectedCell}
        onOpenChange={(open) => !open && setSelectedCell(null)}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle>
                  Traffic Grid [{selectedCoords?.x}, {selectedCoords?.y}]
                </DialogTitle>
                <div className="text-xs text-muted-foreground font-mono">
                  Last updated:{" "}
                  {selectedCell?.ts
                    ? parseISTTimestamp(selectedCell.ts).toLocaleString(
                        "en-IN",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          timeZone: "Asia/Kolkata",
                        },
                      )
                    : "N/A"}
                </div>
              </div>
              {selectedCoords && (
                <a
                  href={getGoogleMapsUrl(
                    getCellCenterCoordinates(selectedCoords.x, selectedCoords.y)
                      .lat,
                    getCellCenterCoordinates(selectedCoords.x, selectedCoords.y)
                      .lng,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  View on Google Maps
                </a>
              )}
            </div>
          </DialogHeader>
          {selectedCell ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-traffic-yellow/20 border border-traffic-yellow/50">
                  <div className="text-2xl font-bold text-traffic-yellow">
                    {selectedCell.yellow}
                  </div>
                  <div className="text-xs text-muted-foreground">Yellow</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-traffic-red/20 border border-traffic-red/50">
                  <div className="text-2xl font-bold text-traffic-red">
                    {selectedCell.red}
                  </div>
                  <div className="text-xs text-muted-foreground">Red</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-traffic-dark-red/20 border border-traffic-dark-red/50">
                  <div className="text-2xl font-bold text-traffic-dark-red">
                    {selectedCell.dark_red}
                  </div>
                  <div className="text-xs text-muted-foreground">Dark Red</div>
                </div>
              </div>

              {/* Severity Information */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="text-2xl font-bold text-foreground">
                    {selectedCell.latest_severity?.toFixed(0) || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Latest Severity
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {selectedCell.p95?.toFixed(0) || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">P95</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {selectedCell.p99?.toFixed(0) || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">P99</div>
                </div>
              </div>

              {/* Historical Chart Section */}
              <div className="space-y-3">
                <HistoricalChart
                  data={historicalData || []}
                  isLoading={isHistoricalLoading}
                  selectedDuration={selectedDuration}
                  onDurationChange={setSelectedDuration}
                />
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <div className="w-24 h-24 mx-auto mb-4 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center">
                <span className="text-2xl font-bold">0</span>
              </div>
              <p>No unusual traffic detected in this grid</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
