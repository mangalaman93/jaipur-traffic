import React, { useMemo, useEffect, useState } from "react";
import {
  Map as LeafletMap,
  map as createMap,
  tileLayer,
  rectangle,
  LatLngBoundsExpression,
} from "leaflet";
import L from "leaflet";
import { TrafficData } from "@/lib/types";
import { GRID_BOUNDS, getCellBounds } from "@/lib/gridBoundaries";
import {
  calculateTotalTraffic,
  calculateSeverityDifferences,
} from "@/lib/trafficUtils";

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
  isTop10: boolean,
): {
  fillColor: string;
  fillOpacity: number;
} {
  if (!cell) {
    return {
      fillColor: "#f1f5f9",
      fillOpacity: 0.15,
    };
  }

  const total = calculateTotalTraffic(cell);

  if (mode === "severity") {
    const { p95Diff, p99Diff } = calculateSeverityDifferences(cell);

    if (p99Diff > 0) {
      return {
        fillColor: "#dc2626",
        fillOpacity: isTop10 ? 0.35 : 0.25,
      };
    }
    if (p95Diff > 0) {
      return {
        fillColor: "#ca8a04",
        fillOpacity: isTop10 ? 0.35 : 0.25,
      };
    }
    return {
      fillColor: "#f1f5f9",
      fillOpacity: 0.15,
    };
  }

  // Traffic mode
  if (total === 0) {
    return {
      fillColor: "#f1f5f9",
      fillOpacity: 0.15,
    };
  }

  if (cell.dark_red > 0) {
    return {
      fillColor: "#7f1d1d",
      fillOpacity: isTop10 ? 0.4 : 0.3,
    };
  }
  if (cell.red > 0) {
    return {
      fillColor: "#dc2626",
      fillOpacity: isTop10 ? 0.35 : 0.25,
    };
  }
  if (cell.yellow > 0) {
    return {
      fillColor: "#eab308",
      fillOpacity: isTop10 ? 0.35 : 0.25,
    };
  }

  return {
    fillColor: "#f1f5f9",
    fillOpacity: 0.15,
  };
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
    data.forEach((item) => {
      map.set(`${item.x}-${item.y}`, item);
    });
    return map;
  }, [data]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const bounds: LatLngBoundsExpression = [
      [GRID_BOUNDS.SOUTH, GRID_BOUNDS.WEST],
      [GRID_BOUNDS.NORTH, GRID_BOUNDS.EAST],
    ];

    const mapInstance = createMap(mapContainerRef.current, {
      center: [
        (GRID_BOUNDS.NORTH + GRID_BOUNDS.SOUTH) / 2,
        (GRID_BOUNDS.WEST + GRID_BOUNDS.EAST) / 2,
      ],
      zoom: 12,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance);

    // Add CSS for rounded corners, grid numbers, and modal z-index
    const style = document.createElement("style");
    style.textContent = `
      .grid-cell svg path {
        rx: 3px !important;
        ry: 3px !important;
      }
      .grid-number {
        z-index: 1000 !important;
      }
      .grid-number div {
        font-family: system-ui, -apple-system, sans-serif !important;
        background: hsl(var(--primary)) !important;
        color: hsl(var(--primary-foreground)) !important;
        border-color: hsl(var(--primary-foreground)) !important;
      }
      .leaflet-container {
        z-index: 1 !important;
      }
      .leaflet-control-container {
        z-index: 2 !important;
      }
    `;
    document.head.appendChild(style);

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

    // Clear existing rectangles and numbers
    mapInstance.eachLayer((layer) => {
      const layerWithCustomOptions = layer as L.Layer & {
        options?: { className?: string };
      };
      if (
        layerWithCustomOptions.options?.className === "grid-cell" ||
        layerWithCustomOptions.options?.className === "grid-number" ||
        layerWithCustomOptions.options?.className === "grid-rank"
      ) {
        mapInstance.removeLayer(layer);
      }
    });

    // Add grid cells
    for (let y = 0; y < GRID_BOUNDS.ROWS; y++) {
      for (let x = 0; x < GRID_BOUNDS.COLS; x++) {
        const cellBounds = getCellBounds(x, y);
        const bounds: LatLngBoundsExpression = [
          [cellBounds.south, cellBounds.west],
          [cellBounds.north, cellBounds.east],
        ];
        const cellKey = `${x}-${y}`;
        const cell = dataMap.get(cellKey);
        const isTop10 = highlightTop10 && top10Cells.has(cellKey);
        const colors = getCellColor(cell, mode, isTop10);

        const rect = rectangle(bounds, {
          color: "#000000",
          weight: 1,
          fillColor: colors.fillColor,
          fillOpacity: colors.fillOpacity,
          className: "grid-cell",
        });

        // Apply rounded corners via CSS
        rect.on("add", function () {
          const element = this.getElement();
          if (element) {
            element.style.borderRadius = "4px";
          }
        });

        // Add grid number for all cells
        const gridNumber = `${x + 1},${y + 1}`;
        const center = rect.getBounds().getCenter();

        // Create a custom div icon for the grid number
        const numberIcon = L.divIcon({
          html: `<div style="
            background: transparent !important;
            color: #1f2937 !important;
            border-radius: 0 !important;
            width: auto !important;
            height: auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 7px !important;
            font-weight: 400 !important;
            box-shadow: none !important;
            pointer-events: none !important;
            position: absolute !important;
            left: 4px !important;
            top: 4px !important;
            transform: none !important;
            z-index: 1000 !important;
            border: none !important;
            font-family: system-ui, -apple-system, sans-serif !important;
            text-shadow: 1px 1px 1px rgba(255,255,255,0.8),
                         -1px -1px 1px rgba(255,255,255,0.8),
                         1px -1px 1px rgba(255,255,255,0.8),
                         -1px 1px 1px rgba(255,255,255,0.8) !important;
            line-height: 1 !important;
          ">${gridNumber}</div>`,
          className: "grid-number",
          iconSize: [1, 1], // Minimal size since we're positioning absolutely
          iconAnchor: [0, 0],
        });

        const numberMarker = L.marker(
          [rect.getBounds().getNorth(), rect.getBounds().getWest()],
          { icon: numberIcon },
        );
        numberMarker.setZIndexOffset(1000);
        numberMarker.addTo(mapInstance);

        // Add rank number for top 10 cells if highlighting is enabled
        if (isTop10) {
          const rank = Array.from(top10Cells).indexOf(cellKey) + 1;

          // Create a separate icon for the rank badge
          const rankIcon = L.divIcon({
            html: `<div style="
              background: hsl(var(--primary)) !important;
              color: hsl(var(--primary-foreground)) !important;
              border-radius: 50% !important;
              width: 16px !important;
              height: 16px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-size: 9px !important;
              font-weight: bold !important;
              box-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
              pointer-events: none !important;
              position: absolute !important;
              left: 50% !important;
              top: 50% !important;
              transform: translate(-50%, -50%) !important;
              z-index: 1001 !important;
              border: 1px solid hsl(var(--primary-foreground)) !important;
              font-family: system-ui, -apple-system, sans-serif !important;
              text-shadow: none !important;
              line-height: 1 !important;
            ">${rank}</div>`,
            className: "grid-rank",
            iconSize: [1, 1],
            iconAnchor: [0.5, 0.5],
          });

          const rankMarker = L.marker(center, { icon: rankIcon });
          rankMarker.setZIndexOffset(1001);
          rankMarker.addTo(mapInstance);
        }

        rect.on("click", () => onCellClick(x, y));
        rect.addTo(mapInstance);
      }
    }
  }, [dataMap, mode, highlightTop10, top10Cells, onCellClick, isMapReady]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        height: "100%",
        width: "100%",
        borderRadius: "0.5rem",
      }}
    />
  );
}
