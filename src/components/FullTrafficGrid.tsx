import { useState } from "react";
import { cn } from "@/lib/utils";
import { TrafficData } from "@/types/traffic";
import { parseISTTimestamp } from "@/utils/timeUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Constants for coordinate calculation
const JAIPUR_NORTH_WEST_LAT = 26.99;
const JAIPUR_SOUTH_EAST_LAT = 26.78;
const JAIPUR_NORTH_WEST_LNG = 75.65;
const JAIPUR_SOUTH_EAST_LNG = 75.92;
const CELL_HEIGHT_METERS = 1100;
const CELL_WIDTH_METERS = 1800;
const METERS_PER_DEGREE_LAT = 111320; // Approximate meters per degree of latitude

// Helper functions for coordinate calculation
const addMetersInLatitude = (latitude: number, meters: number): number => {
  return latitude - meters / METERS_PER_DEGREE_LAT;
};

const addMetersInLongitude = (latitude: number, longitude: number, meters: number): number => {
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos(latitude * Math.PI / 180);
  return longitude + meters / metersPerDegreeLng;
};

// Calculate center coordinates of a grid cell
const getCellCenterCoordinates = (col: number, row: number): { lat: number; lng: number } => {
  // Calculate the top-left corner of the cell
  const cellTopLat = addMetersInLatitude(JAIPUR_NORTH_WEST_LAT, row * CELL_HEIGHT_METERS);
  const cellLeftLng = addMetersInLongitude(JAIPUR_NORTH_WEST_LAT, JAIPUR_NORTH_WEST_LNG, col * CELL_WIDTH_METERS);
  
  // Calculate center by adding half cell dimensions
  const centerLat = addMetersInLatitude(cellTopLat, CELL_HEIGHT_METERS / 2);
  const centerLng = addMetersInLongitude(cellTopLat, cellLeftLng, CELL_WIDTH_METERS / 2);
  
  return { lat: centerLat, lng: centerLng };
};

// Generate Google Maps URL
const getGoogleMapsUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps/@${lat},${lng},1200m/data=!3m1!1e3!5m1!1e1`;
};

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
      return "bg-traffic-dark-red/80 border-traffic-dark-red";
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
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <div className="flex">
            {/* Row labels column */}
            <div className="flex flex-col">
              <div className="w-6 sm:w-8 h-8 border border-border rounded-tl-lg" /> {/* Empty corner - top-left rounded */}
              {Array.from({ length: rows }, (_, row) => (
                <div 
                  key={`row-label-${row}`} 
                  className={cn(
                    "flex items-center justify-center text-xs font-mono text-muted-foreground w-6 sm:w-8 border-l border-b border-border",
                    row === rows - 1 && "border-l border-b border-r rounded-bl-lg"
                  )}
                  style={{ height: `calc((100% - ${rows - 1}px) / ${rows})` }}
                >
                  {row}
                </div>
              ))}
            </div>

            {/* Header row with column numbers */}
            <div className="flex-1">
              <div className="border border-border overflow-hidden">
                <div 
                  className="grid gap-1 bg-card"
                  style={{ 
                    gridTemplateColumns: `repeat(${cols}, minmax(24px, 1fr))`,
                  }}
                >
                  {Array.from({ length: cols }, (_, col) => (
                    <div 
                      key={`header-${col}`} 
                      className="text-center text-xs font-mono text-muted-foreground py-1 px-1"
                    >
                      {col}
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid with background image and proper aspect ratio */}
              <div 
                className="relative bg-cover bg-center bg-no-repeat rounded-br-lg overflow-hidden border border-border border-t-0"
                style={{ 
                  backgroundImage: 'url(/data/jaipur.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  aspectRatio: `${12750}/${10920}` // Overall aspect ratio for the entire grid
                }}
              >
                <div className="absolute inset-0 grid gap-1" style={{ 
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                }}>
                  {Array.from({ length: rows }, (_, row) => (
                    <>
                      {/* Grid cells */}
                      {Array.from({ length: cols }, (_, col) => {
                        const cell = dataMap.get(`${col}-${row}`);
                        const severity = getSeverity(cell);
                        const isHighlighted = severity !== "normal";

                        return (
                          <button
                            key={`cell-${col}-${row}`}
                            onClick={() => handleCellClick(col, row)}
                            className={cn(
                              "rounded-sm border transition-all duration-200",
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
            </div>
          </div>
        </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-muted/30 border border-border/50" />
          <span className="text-muted-foreground">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-traffic-yellow/60 border border-traffic-yellow" />
          <span className="text-muted-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-traffic-red/70 border border-traffic-red" />
          <span className="text-muted-foreground">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-traffic-dark-red/80 border border-traffic-dark-red" />
          <span className="text-muted-foreground">Critical</span>
        </div>
      </div>
    </div>

    {/* Dialog for cell details */}
    <Dialog open={!!selectedCell} onOpenChange={(open) => !open && setSelectedCell(null)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Traffic Grid Details</DialogTitle>
        </DialogHeader>
        {selectedCell ? (
          <div className="space-y-4">
            <div className="text-center text-lg font-mono">
              Grid [{selectedCoords?.x}, {selectedCoords?.y}]
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-traffic-yellow/20 border border-traffic-yellow/50">
                <div className="text-2xl font-bold text-traffic-yellow">{selectedCell.yellow}</div>
                <div className="text-xs text-muted-foreground">Yellow</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-traffic-red/20 border border-traffic-red/50">
                <div className="text-2xl font-bold text-traffic-red">{selectedCell.red}</div>
                <div className="text-xs text-muted-foreground">Red</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-traffic-dark-red/20 border border-traffic-dark-red/50">
                <div className="text-2xl font-bold text-traffic-dark-red">{selectedCell.dark_red}</div>
                <div className="text-xs text-muted-foreground">Dark Red</div>
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-center text-sm text-muted-foreground font-mono">
              Last updated: {parseISTTimestamp(selectedCell.ts).toLocaleString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Asia/Kolkata'
              })}
            </div>

            {/* Google Maps Link */}
            {selectedCoords && (
              <div className="text-center">
                <a
                  href={getGoogleMapsUrl(
                    getCellCenterCoordinates(selectedCoords.x, selectedCoords.y).lat,
                    getCellCenterCoordinates(selectedCoords.x, selectedCoords.y).lng
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View on Google Maps
                </a>
              </div>
            )}
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
