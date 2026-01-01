import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { TrafficData } from "@/types/traffic";
import { parseISTTimestamp, getHoursAgo } from "@/utils/timeUtils";
import {
  getCellCenterCoordinates,
  getGoogleMapsUrl,
} from "@/utils/coordinateUtils";
import {
  calculateSeverityDifferences,
  calculateTotalTraffic,
} from "@/utils/trafficUtils";
import { formatRangeTime } from "@/utils/timeFormat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HistoricalChart } from "@/components/HistoricalChart";
import { GridCell } from "@/components/GridCell";
import { TrafficLegend } from "@/components/TrafficLegend";
import { DailyAverageTraffic } from "@/components/DailyAverageTraffic";
import { SeverityInfo } from "@/components/SeverityInfo";
import { GRID_DIMENSIONS, API_ENDPOINTS } from "@/constants/traffic";

interface FullTrafficGridProps {
  data: TrafficData[];
  rows?: number;
  cols?: number;
  mode?: "traffic" | "severity";
  highlightTop10?: boolean;
  initialSelectedCell?: TrafficData | null;
  activeTab?: string;
}

const ROW_HEIGHT = 53.3;
const GRID_ASPECT_RATIO = GRID_DIMENSIONS.ASPECT_RATIO;

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

const getTop10SeverityCells = (data: TrafficData[]): Set<string> => {
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
    return new Set(p99Cells.map((cell) => `${cell.x}-${cell.y}`));
  }

  const p95Cells = processedData
    .filter((cell) => cell.p95Diff > 0 && cell.p99Diff <= 0)
    .sort((a, b) => b.p95Diff - a.p95Diff)
    .slice(0, 10 - p99Cells.length);

  return new Set(
    [...p99Cells, ...p95Cells].map((cell) => `${cell.x}-${cell.y}`),
  );
};

const getTop10TrafficCells = (data: TrafficData[]): Set<string> => {
  const sortedData = data
    .filter((cell) => calculateTotalTraffic(cell) > 0)
    .sort((a, b) => calculateTotalTraffic(b) - calculateTotalTraffic(a))
    .slice(0, 10);

  return new Set(sortedData.map((cell) => `${cell.x}-${cell.y}`));
};

export function FullTrafficGrid({
  data,
  rows = GRID_DIMENSIONS.ROWS,
  cols = GRID_DIMENSIONS.COLS,
  mode = "traffic",
  highlightTop10 = false,
  initialSelectedCell,
  activeTab = "traffic",
}: FullTrafficGridProps) {
  const [selectedCell, setSelectedCell] = useState<TrafficData | null>(
    initialSelectedCell || null,
  );
  const [selectedCoords, setSelectedCoords] = useState<{
    x: number;
    y: number;
  } | null>(
    initialSelectedCell
      ? { x: initialSelectedCell.x, y: initialSelectedCell.y }
      : null,
  );
  const [selectedDuration, setSelectedDuration] = useState<string>("24h");

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

      const url = API_ENDPOINTS.HISTORY(
        selectedCoords.x,
        selectedCoords.y,
        selectedDuration,
      );
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch historical data");
      }
      const data = await response.json();
      return data as TrafficData[];
    },
    enabled: !!selectedCoords,
  });

  React.useEffect(() => {
    if (
      initialSelectedCell &&
      (!selectedCell ||
        selectedCell.x !== initialSelectedCell.x ||
        selectedCell.y !== initialSelectedCell.y)
    ) {
      setSelectedCell(initialSelectedCell);
      setSelectedCoords({ x: initialSelectedCell.x, y: initialSelectedCell.y });
    }
  }, [initialSelectedCell, selectedCell]);

  React.useEffect(() => {
    setSelectedCell(null);
    setSelectedCoords(null);
  }, [activeTab]);

  const gridContainerRef = React.useRef<HTMLDivElement>(null);
  const rowHeight = useRowHeight(gridContainerRef, rows);

  const dataMap = useMemo(() => {
    const map = new Map<string, TrafficData>();
    data.forEach((item) => {
      map.set(`${item.x}-${item.y}`, item);
    });
    return map;
  }, [data]);

  const gridStyles = useMemo(
    () => ({
      headerGrid: { gridTemplateColumns: `repeat(${cols}, minmax(2rem, 1fr))` },
      mainGrid: { gridTemplateColumns: `repeat(${cols}, 1fr)` },
      aspectRatio: { aspectRatio: GRID_ASPECT_RATIO },
    }),
    [cols],
  );

  const top10Cells = useMemo((): Set<string> => {
    if (!highlightTop10) return new Set<string>();

    return mode === "severity"
      ? getTop10SeverityCells(data)
      : getTop10TrafficCells(data);
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
                className={cn(
                  "w-8 border border-border rounded-tl-lg",
                  "flex items-center justify-center",
                  "text-xs font-mono text-muted-foreground",
                )}
                style={{ height: rowHeight }}
              />
              {/* Empty corner - top-left rounded */}
              {Array.from({ length: rows }, (_, row) => (
                <div
                  key={`row-label-${row}`}
                  className={cn(
                    "flex items-center justify-center",
                    "text-xs font-mono text-muted-foreground",
                    "w-8 h-12 border-l border-b border-border",
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
                      className={cn(
                        "flex items-center justify-center",
                        "text-xs font-mono text-muted-foreground",
                        "px-1 border border-border",
                      )}
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
                className={cn(
                  "relative bg-cover bg-center bg-no-repeat",
                  "rounded-br-lg overflow-hidden",
                  "border border-border border-t-0",
                )}
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
                      {Array.from({ length: cols }, (_, col) => {
                        const cell = dataMap.get(`${col}-${row}`);
                        const cellKey = `${col}-${row}`;
                        const isTop10 =
                          highlightTop10 && top10Cells.has(cellKey);

                        return (
                          <GridCell
                            key={cellKey}
                            cell={cell}
                            col={col}
                            row={row}
                            mode={mode}
                            isTop10={isTop10}
                            top10Cells={top10Cells}
                            onCellClick={handleCellClick}
                          />
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
          <TrafficLegend mode={mode} />
        </div>
      </div>

      {/* Dialog for cell details */}
      <Dialog
        open={!!selectedCell}
        onOpenChange={(open) => !open && setSelectedCell(null)}
      >
        <DialogContent
          className={cn(
            "sm:max-w-[800px] max-h-[90vh] overflow-y-auto",
            "data-[state=open]:slide-in-from-top-[10%]",
            "data-[state=closed]:slide-out-to-top-[10%]",
          )}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle>
                  Traffic Grid [{selectedCoords?.x}, {selectedCoords?.y}]
                </DialogTitle>
                <div className="text-xs text-muted-foreground font-mono">
                  Last updated:{" "}
                  {selectedCell?.ts
                    ? `${formatRangeTime(parseISTTimestamp(selectedCell.ts))} (${getHoursAgo(
                        parseISTTimestamp(selectedCell.ts),
                      )})`
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
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2",
                    "bg-primary text-primary-foreground rounded-lg",
                    "hover:bg-primary/90 transition-colors text-sm font-medium",
                  )}
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
              <div className="space-y-2">
                <SeverityInfo
                  selectedCell={selectedCell}
                  activeTab={activeTab}
                />
              </div>

              {/* Daily Average Traffic */}
              {historicalData && historicalData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    <span className="text-primary">{">"}</span>
                    <span>Daily Average Traffic (Severity)</span>
                  </div>
                  <div className="space-y-1">
                    <DailyAverageTraffic historicalData={historicalData} />
                  </div>
                </div>
              )}

              {/* Historical Chart Section */}
              <HistoricalChart
                data={historicalData || []}
                isLoading={isHistoricalLoading}
                selectedDuration={selectedDuration}
                onDurationChange={setSelectedDuration}
              />
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <div
                className={cn(
                  "w-24 h-24 mx-auto mb-4",
                  "rounded-lg bg-muted/30",
                  "border border-border/50",
                  "flex items-center justify-center",
                )}
              >
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
