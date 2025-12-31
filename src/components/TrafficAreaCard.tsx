import React from "react";
import { TrafficData } from "@/types/traffic";
import {
  getCellCenterCoordinates,
  getGoogleMapsUrl,
} from "@/utils/coordinateUtils";
import {
  calculateTotalTraffic,
  getTrafficSeverityLevel,
} from "@/utils/trafficUtils";

interface TrafficAreaCardProps {
  cell: TrafficData;
  index: number;
  showThresholdP95?: boolean;
  severityColors?: Record<string, string>;
  severityLevelColors?: Record<string, string>;
  onDetailsClick?: (cell: TrafficData) => void;
}

export function TrafficAreaCard({
  cell,
  index,
  showThresholdP95 = false,
  severityColors,
  severityLevelColors,
  onDetailsClick,
}: TrafficAreaCardProps) {
  const totalTraffic = calculateTotalTraffic(cell);
  const severity = getTrafficSeverityLevel(cell);

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left section: Rank, Grid Info, Severity */}
        <div className="flex items-center gap-3">
          {/* Rank */}
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
            {index + 1}
          </div>

          {/* Grid Info */}
          <div className="min-w-0">
            <div className="font-mono text-sm font-bold">
              Grid [{cell.x}, {cell.y}]
            </div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                Severity:{" "}
                <span className="font-bold">
                  {cell.latest_severity?.toFixed(0) || "N/A"}
                </span>
              </span>
              {showThresholdP95 ? (
                <span className="text-xs text-muted-foreground">
                  Threshold P95:{" "}
                  <span className="font-bold">
                    {cell.threshold_p95?.toFixed(0) || "N/A"}
                  </span>
                </span>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">
                    P95:{" "}
                    <span className="font-bold">
                      {cell.p95?.toFixed(0) || "N/A"}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    P99:{" "}
                    <span className="font-bold">
                      {cell.p99?.toFixed(0) || "N/A"}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Severity Badge */}
          <div
            className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium border ${
              severityLevelColors
                ? severityLevelColors[
                    (cell as any).severityLevel as keyof typeof severityLevelColors
                  ]
                : severityColors
                ? severityColors[severity as keyof typeof severityColors]
                : ""
            }`}
          >
            {severityLevelColors
              ? (cell as any).severityLevel.charAt(0).toUpperCase() +
                (cell as any).severityLevel.slice(1)
              : severity.charAt(0).toUpperCase() + severity.slice(1)}
          </div>
        </div>

        {/* Traffic Counts and Actions - Full width on mobile */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-2 pl-11 sm:pl-0">
          <div className="text-center">
            <div className="text-base sm:text-lg font-bold text-traffic-yellow">
              {cell.yellow}
            </div>
            <div className="text-xs text-muted-foreground">Yellow</div>
          </div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-bold text-traffic-red">
              {cell.red}
            </div>
            <div className="text-xs text-muted-foreground">Red</div>
          </div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-bold text-traffic-dark-red">
              {cell.dark_red}
            </div>
            <div className="text-xs text-muted-foreground">Dark Red</div>
          </div>

          {/* Google Maps Link */}
          <a
            href={getGoogleMapsUrl(
              getCellCenterCoordinates(cell.x, cell.y).lat,
              getCellCenterCoordinates(cell.x, cell.y).lng,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex-shrink-0 inline-flex items-center justify-center
              w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1
              bg-primary text-primary-foreground rounded-full sm:rounded
              hover:bg-primary/90 transition-colors text-xs font-medium
            "
            title="View on Google Maps"
          >
            <svg
              className="w-4 h-4 sm:w-3 sm:h-3"
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
            <span className="hidden sm:inline sm:ml-2">View on Maps</span>
          </a>

          {/* Details Button */}
          <button
            className="
              flex-shrink-0 inline-flex items-center justify-center
              w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1
              bg-secondary text-secondary-foreground rounded-full sm:rounded
              hover:bg-secondary/80 transition-colors text-xs font-medium
            "
            title="View Details"
            onClick={() => onDetailsClick?.(cell)}
          >
            <svg
              className="w-4 h-4 sm:w-3 sm:h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="hidden sm:inline sm:ml-2">Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
