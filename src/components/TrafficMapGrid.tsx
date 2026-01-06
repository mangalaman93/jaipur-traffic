import React, { useMemo, useEffect, useState } from "react";
import { LatLngBounds, Map as LeafletMap, map as createMap, tileLayer, rectangle, LatLngBoundsExpression } from "leaflet";
import { TrafficData } from "@/lib/types";
import { GRID_BOUNDS, getCellBounds } from "@/lib/gridBoundaries";
import { calculateTotalTraffic, calculateSeverityDifferences } from "@/lib/trafficUtils";

interface TrafficMapGridProps {
  data: TrafficData[];
  mode?: "traffic" | "severity";
  highlightTop10?: boolean;
  top10Cells: Set<string>;
  onCellClick: (x: number, y: number) => void;
}

function getCellColor(
  cell: TrafficData | undefined,
  mode: "traffic" | "severity",
  isTop10: boolean
): { fillColor: string; fillOpacity: number; borderColor: string; borderWeight: number } {
  if (!cell) {
    return { fillColor: "transparent", fillOpacity: 0, borderColor: "rgba(128, 128, 128, 0.3)", borderWeight: 1 };
  }

  const total = calculateTotalTraffic(cell);
  
  if (mode === "severity") {
    const { p95Diff, p99Diff } = calculateSeverityDifferences(cell);
    
    if (p99Diff > 0) {
      return { 
        fillColor: "#dc2626", 
        fillOpacity: isTop10 ? 0.7 : 0.5, 
        borderColor: isTop10 ? "#fbbf24" : "#dc2626",
        borderWeight: isTop10 ? 3 : 1
      };
    }
    if (p95Diff > 0) {
      return { 
        fillColor: "#ca8a04", 
        fillOpacity: isTop10 ? 0.7 : 0.5, 
        borderColor: isTop10 ? "#fbbf24" : "#ca8a04",
        borderWeight: isTop10 ? 3 : 1
      };
    }
    return { fillColor: "transparent", fillOpacity: 0, borderColor: "rgba(128, 128, 128, 0.3)", borderWeight: 1 };
  }

  // Traffic mode
  if (total === 0) {
    return { fillColor: "transparent", fillOpacity: 0, borderColor: "rgba(128, 128, 128, 0.3)", borderWeight: 1 };
  }

  if (cell.dark_red > 0) {
    return { 
      fillColor: "#7f1d1d", 
      fillOpacity: isTop10 ? 0.8 : 0.6, 
      borderColor: isTop10 ? "#fbbf24" : "#7f1d1d",
      borderWeight: isTop10 ? 3 : 1
    };
  }
  if (cell.red > 0) {
    return { 
      fillColor: "#dc2626", 
      fillOpacity: isTop10 ? 0.7 : 0.5, 
      borderColor: isTop10 ? "#fbbf24" : "#dc2626",
      borderWeight: isTop10 ? 3 : 1
    };
  }
  if (cell.yellow > 0) {
    return { 
      fillColor: "#eab308", 
      fillOpacity: isTop10 ? 0.7 : 0.5, 
      borderColor: isTop10 ? "#fbbf24" : "#eab308",
      borderWeight: isTop10 ? 3 : 1
    };
  }

  return { fillColor: "transparent", fillOpacity: 0, borderColor: "rgba(128, 128, 128, 0.3)", borderWeight: 1 };
}

export function TrafficMapGrid({
  data,
  mode = "traffic",
  highlightTop10 = false,
  top10Cells,
  onCellClick,
}: TrafficMapGridProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const dataMap = useMemo(() => {
    const map = new Map<string, TrafficData>();
    data.forEach(item => {
      map.set(`${item.x}-${item.y}`, item);
    });
    return map;
  }, [data]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const bounds: LatLngBoundsExpression = [
      [GRID_BOUNDS.SOUTH, GRID_BOUNDS.WEST],
      [GRID_BOUNDS.NORTH, GRID_BOUNDS.EAST]
    ];

    const mapInstance = createMap(mapContainerRef.current, {
      center: [(GRID_BOUNDS.NORTH + GRID_BOUNDS.SOUTH) / 2, (GRID_BOUNDS.WEST + GRID_BOUNDS.EAST) / 2],
      zoom: 12,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    mapInstance.fitBounds(bounds, { padding: [10, 10] });
    
    mapRef.current = mapInstance;
    setIsMapReady(true);

    return () => {
      mapInstance.remove();
      mapRef.current = null;
    };
  }, []);

  // Update grid cells when data changes
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    const mapInstance = mapRef.current;

    // Clear existing rectangles
    mapInstance.eachLayer((layer) => {
      if ((layer as any).options?.className === 'grid-cell') {
        mapInstance.removeLayer(layer);
      }
    });

    // Add grid cells
    for (let y = 0; y < GRID_BOUNDS.ROWS; y++) {
      for (let x = 0; x < GRID_BOUNDS.COLS; x++) {
        const cellBounds = getCellBounds(x, y);
        const bounds: LatLngBoundsExpression = [
          [cellBounds.south, cellBounds.west],
          [cellBounds.north, cellBounds.east]
        ];
        const cellKey = `${x}-${y}`;
        const cell = dataMap.get(cellKey);
        const isTop10 = highlightTop10 && top10Cells.has(cellKey);
        const colors = getCellColor(cell, mode, isTop10);

        const rect = rectangle(bounds, {
          color: colors.borderColor,
          weight: colors.borderWeight,
          fillColor: colors.fillColor,
          fillOpacity: colors.fillOpacity,
          className: 'grid-cell',
        });

        rect.on('click', () => onCellClick(x, y));
        rect.addTo(mapInstance);
      }
    }
  }, [dataMap, mode, highlightTop10, top10Cells, onCellClick, isMapReady]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
    />
  );
}
