import { useState } from "react";
import { cn } from "@/lib/utils";
import { TrafficData } from "./TrafficGrid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FullTrafficGridProps {
  data: TrafficData[];
  rows?: number;
  cols?: number;
}

const getSeverity = (cell: TrafficData | undefined): "normal" | "yellow" | "red" | "darkRed" => {
  if (!cell) return "normal";
  if (cell.dark_red > 0) return "darkRed";
  if (cell.red > 0) return "red";
  if (cell.yellow > 0) return "yellow";
  return "normal";
};

const getSeverityStyles = (severity: "normal" | "yellow" | "red" | "darkRed") => {
  switch (severity) {
    case "darkRed":
      return "bg-traffic-dark-red/80 border-traffic-dark-red animate-pulse";
    case "red":
      return "bg-traffic-red/70 border-traffic-red";
    case "yellow":
      return "bg-traffic-yellow/60 border-traffic-yellow";
    default:
      return "bg-muted/30 border-border/50";
  }
};

export function FullTrafficGrid({ data, rows = 21, cols = 15 }: FullTrafficGridProps) {
  const [selectedCell, setSelectedCell] = useState<TrafficData | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ x: number; y: number } | null>(null);

  // Create a map for quick lookup
  const dataMap = new Map<string, TrafficData>();
  data.forEach((item) => {
    dataMap.set(`${item.x}-${item.y}`, item);
  });

  const handleCellClick = (x: number, y: number) => {
    const cell = dataMap.get(`${x}-${y}`);
    setSelectedCoords({ x, y });
    setSelectedCell(cell || null);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <div 
          className="grid gap-1 p-4 bg-card/50 rounded-lg border border-border min-w-fit"
          style={{ 
            gridTemplateColumns: `auto repeat(${cols}, minmax(28px, 1fr))`,
          }}
        >
          {/* Header row with column numbers */}
          <div className="w-8" /> {/* Empty corner */}
          {Array.from({ length: cols }, (_, col) => (
            <div 
              key={`header-${col}`} 
              className="text-center text-xs font-mono text-muted-foreground py-1"
            >
              {col}
            </div>
          ))}

          {/* Grid rows */}
          {Array.from({ length: rows }, (_, row) => (
            <>
              {/* Row label */}
              <div 
                key={`row-label-${row}`} 
                className="flex items-center justify-center text-xs font-mono text-muted-foreground w-8"
              >
                {row}
              </div>
              
              {/* Cells */}
              {Array.from({ length: cols }, (_, col) => {
                const cell = dataMap.get(`${col}-${row}`);
                const severity = getSeverity(cell);
                const isHighlighted = severity !== "normal";

                return (
                  <button
                    key={`cell-${col}-${row}`}
                    onClick={() => handleCellClick(col, row)}
                    className={cn(
                      "aspect-square rounded-sm border transition-all duration-200",
                      "hover:scale-110 hover:z-10 hover:shadow-lg",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50",
                      getSeverityStyles(severity),
                      isHighlighted && "cursor-pointer"
                    )}
                    title={cell ? `Grid [${col}, ${row}] - Y:${cell.yellow} R:${cell.red} DR:${cell.dark_red}` : `Grid [${col}, ${row}]`}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-muted/30 border border-border/50" />
          <span className="text-muted-foreground">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-traffic-yellow/60 border border-traffic-yellow" />
          <span className="text-muted-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-traffic-red/70 border border-traffic-red" />
          <span className="text-muted-foreground">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-traffic-dark-red/80 border border-traffic-dark-red" />
          <span className="text-muted-foreground">Critical</span>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={selectedCoords !== null} onOpenChange={() => { setSelectedCoords(null); setSelectedCell(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">
              Grid [{selectedCoords?.x}, {selectedCoords?.y}]
            </DialogTitle>
          </DialogHeader>
          
          {selectedCell ? (
            <div className="space-y-6">
              {/* Zoomed cell visualization */}
              <div 
                className={cn(
                  "w-32 h-32 mx-auto rounded-lg border-4 flex items-center justify-center",
                  "transition-all duration-300",
                  getSeverityStyles(getSeverity(selectedCell))
                )}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {selectedCell.yellow + selectedCell.red + selectedCell.dark_red}
                  </div>
                  <div className="text-xs text-muted-foreground">total events</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-traffic-yellow/20 border border-traffic-yellow/50">
                  <div className="text-2xl font-bold text-traffic-yellow">{selectedCell.yellow}</div>
                  <div className="text-xs text-muted-foreground">Yellow</div>
                </div>
                <div className="p-3 rounded-lg bg-traffic-red/20 border border-traffic-red/50">
                  <div className="text-2xl font-bold text-traffic-red">{selectedCell.red}</div>
                  <div className="text-xs text-muted-foreground">Red</div>
                </div>
                <div className="p-3 rounded-lg bg-traffic-dark-red/20 border border-traffic-dark-red/50">
                  <div className="text-2xl font-bold text-traffic-dark-red">{selectedCell.dark_red}</div>
                  <div className="text-xs text-muted-foreground">Dark Red</div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-center text-sm text-muted-foreground font-mono">
                Last updated: {new Date(selectedCell.ts).toLocaleString()}
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
