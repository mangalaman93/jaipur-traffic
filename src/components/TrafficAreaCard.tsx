import React from "react";
import { TrafficData } from "@/lib/types";
import { cn } from "@/lib/cn";
import { getCellCenter, getGoogleMapsUrl } from "@/lib/gridBoundaries";
import {
  calculateTotalTraffic,
  getTrafficSeverityLevel,
} from "@/lib/trafficUtils";

interface TrafficAreaCardProps {
  cell: TrafficData & { severityLevel?: string };
  index: number;
  showThresholdP95?: boolean;
  severityColors?: Record<string, string>;
  severityLevelColors?: Record<string, string>;
  onDetailsClick?: () => void;
}

export function TrafficAreaCard({
  cell,
  index,
  showThresholdP95 = false,
  severityColors,
  severityLevelColors,
  onDetailsClick,
}: TrafficAreaCardProps) {
  const severity = getTrafficSeverityLevel(cell);

  const getSeverityBadgeClass = () => {
    if (severityLevelColors && cell.severityLevel) {
      return severityLevelColors[cell.severityLevel];
    }
    if (severityColors) {
      return severityColors[severity as keyof typeof severityColors];
    }
    return "";
  };

  const getSeverityBadgeText = () => {
    if (severityLevelColors && cell.severityLevel) {
      return (
        cell.severityLevel.charAt(0).toUpperCase() + cell.severityLevel.slice(1)
      );
    }
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-2">
      <div className="flex gap-2">
        {/* Rank - Left side, vertically centered */}
        <div
          className={cn(
            "flex-shrink-0 flex items-center justify-center",
            "w-6 h-6 rounded-full bg-primary/10",
            "text-primary font-bold text-xs",
          )}
        >
          {index + 1}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* First line: Grid Info, Severity Badge, and Action Icons */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {/* Left: Grid Info and Severity Badge */}
            <div className="flex items-center gap-2">
              <div className="font-mono text-xs font-bold">
                Grid [{cell.x}, {cell.y}]
              </div>

              {/* Severity Badge - Next to grid coordinates */}
              <div
                className={cn(
                  "flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs font-medium border",
                  getSeverityBadgeClass(),
                )}
              >
                {getSeverityBadgeText()}
              </div>
            </div>

            {/* Right: Action Icons */}
            <div className="flex gap-1">
              {/* Google Maps Link */}
              <a
                href={getGoogleMapsUrl(
                  getCellCenter(cell.x, cell.y).lat,
                  getCellCenter(cell.x, cell.y).lng,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex-shrink-0 inline-flex items-center justify-center",
                  "w-6 h-6",
                  "bg-primary text-primary-foreground rounded-full",
                  "hover:bg-primary/90 transition-colors",
                )}
                title="View on Google Maps"
              >
                <svg
                  className="w-3 h-3"
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
              </a>

              {/* Details Button */}
              <button
                className={cn(
                  "flex-shrink-0 inline-flex items-center justify-center",
                  "w-6 h-6",
                  "bg-secondary text-secondary-foreground rounded-full",
                  "hover:bg-secondary/80 transition-colors",
                )}
                title="View Details"
                onClick={() => onDetailsClick?.()}
              >
                <svg
                  className="w-3 h-3"
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
              </button>
            </div>
          </div>

          {/* Second line: Stats and Traffic Counts */}
          <div className="flex items-center justify-between gap-2">
            {/* Stats section */}
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>
                S:{" "}
                <span className="font-bold">
                  {cell.latest_severity?.toFixed(0) || "N/A"}
                </span>
              </span>
              {showThresholdP95 ? (
                <span>
                  T:{" "}
                  <span className="font-bold">
                    {cell.threshold_p95?.toFixed(0) || "N/A"}
                  </span>
                </span>
              ) : (
                <>
                  <span>
                    P95:{" "}
                    <span className="font-bold">
                      {cell.p95?.toFixed(0) || "N/A"}
                    </span>
                  </span>
                  <span>
                    P99:{" "}
                    <span className="font-bold">
                      {cell.p99?.toFixed(0) || "N/A"}
                    </span>
                  </span>
                </>
              )}
            </div>

            {/* Traffic Counts - Same inline format */}
            <div className="flex gap-2 text-xs">
              <span>
                Y:{" "}
                <span className="font-bold text-traffic-yellow">
                  {cell.yellow}
                </span>
              </span>
              <span>
                R:{" "}
                <span className="font-bold text-traffic-red">{cell.red}</span>
              </span>
              <span>
                DR:{" "}
                <span className="font-bold text-traffic-dark-red">
                  {cell.dark_red}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
