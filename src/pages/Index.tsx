import { useState, lazy, Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TrafficData } from "@/types/traffic";
import Activity from "lucide-react/dist/esm/icons/activity";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import { parseISTTimestamp } from "@/utils/timeUtils";
import {
  getCellCenterCoordinates,
  getGoogleMapsUrl,
} from "@/utils/coordinateUtils";

// Shared severity color constants
const TRAFFIC_SEVERITY_COLORS = {
  critical:
    "bg-traffic-dark-red/20 border-traffic-dark-red/50 text-traffic-dark-red",
  high: "bg-traffic-red/20 border-traffic-red/50 text-traffic-red",
  medium: "bg-traffic-yellow/20 border-traffic-yellow/50 text-traffic-yellow",
} as const;

const SEVERITY_LEVEL_COLORS = {
  high: "bg-red-600/20 border-red-600/50 text-red-600",
  moderate: "bg-yellow-600/20 border-yellow-600/50 text-yellow-600",
  normal: "bg-muted/20 border-border/50 text-muted-foreground",
} as const;

// Lazy load heavy components
const FullTrafficGrid = lazy(() =>
  import("@/components/FullTrafficGrid").then((m) => ({
    default: m.FullTrafficGrid,
  })),
);
const StatsBar = lazy(() =>
  import("@/components/StatsBar").then((m) => ({ default: m.StatsBar })),
);

export default function Index() {
  const [activeTab, setActiveTab] = useState("traffic");

  const { data: currentData } = useQuery({
    queryKey: ["currentTraffic"],
    queryFn: async () => {
      const response = await fetch(
        "https://traffic-worker.mangalaman93.workers.dev/current",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch current traffic data");
      }
      const data = await response.json();
      return data as TrafficData[];
    },
  });

  // Use the same data for congested areas (no duplicate API call)
  const congestedData = currentData;

  // Calculate Top 10 severity areas based on P99-first, P95-fallback logic
  const topSeverityAreas = useMemo(() => {
    if (!currentData) return [];

    const processedData = currentData
      .filter((cell) => cell.latest_severity && cell.p95 && cell.p99)
      .map((cell) => {
        const p95Diff = cell.latest_severity! - cell.p95!;
        const p99Diff = cell.latest_severity! - cell.p99!;
        return {
          ...cell,
          p95Diff,
          p99Diff,
          severityLevel:
            cell.latest_severity! > cell.p99!
              ? "high"
              : cell.latest_severity! > cell.p95!
                ? "moderate"
                : "normal",
        };
      });

    // First try to find cells with P99 differences
    const p99Cells = processedData
      .filter((cell) => cell.p99Diff > 0)
      .sort((a, b) => b.p99Diff - a.p99Diff)
      .slice(0, 10);

    // If we have 10+ cells with P99 differences, use them
    if (p99Cells.length >= 10) {
      return p99Cells;
    } else {
      // Otherwise, use P95 differences for remaining slots
      const p95Cells = processedData
        .filter((cell) => cell.p95Diff > 0 && cell.p99Diff <= 0)
        .sort((a, b) => b.p95Diff - a.p95Diff)
        .slice(0, 10 - p99Cells.length);

      return [...p99Cells, ...p95Cells].slice(0, 10);
    }
  }, [currentData]);

  // Get the maximum timestamp from current data for last updated time
  const lastUpdated =
    currentData && currentData.length > 0
      ? parseISTTimestamp(
          currentData.reduce(
            (max, d) => (new Date(d.ts) > new Date(max.ts) ? d : max),
            currentData[0],
          ).ts,
        )
      : new Date();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader lastUpdated={lastUpdated} />

      <main className="container py-2 space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="traffic" className="gap-2">
              <Activity className="w-4 h-4" />
              Traffic Analysis
            </TabsTrigger>
            <TabsTrigger value="severity" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Severity Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traffic">
            <div className="space-y-3">
              <Suspense
                fallback={
                  <div className="h-12 bg-muted/20 animate-pulse rounded-lg" />
                }
              >
                <div className="mt-3">
                  <StatsBar data={currentData || []} />
                </div>
              </Suspense>
              <Suspense
                fallback={
                  <div className="aspect-[15/21] bg-muted/20 animate-pulse rounded-lg" />
                }
              >
                <FullTrafficGrid
                  data={currentData || []}
                  rows={21}
                  cols={15}
                  highlightTop10={true}
                />
              </Suspense>

              {/* Top 10 Details Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Top 10 Congested Areas
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Most congested traffic areas right now
                    </p>
                  </div>
                </div>

                {/* Congested Areas List */}
                <div className="space-y-2">
                  {congestedData && congestedData.length > 0 ? (
                    congestedData.slice(0, 10).map((cell, index) => {
                      const totalTraffic =
                        cell.yellow + cell.red + cell.dark_red;
                      const severity =
                        cell.dark_red > 0
                          ? "critical"
                          : cell.red > 0
                            ? "high"
                            : "medium";

                      return (
                        <div
                          key={`${cell.x}-${cell.y}`}
                          className="bg-card border border-border rounded-lg p-3 sm:p-4"
                        >
                          {/* Mobile: Stack vertically, Desktop: Side by side */}
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
                                      {cell.latest_severity?.toFixed(0) ||
                                        "N/A"}
                                    </span>
                                  </span>
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
                                </div>
                              </div>

                              {/* Severity Badge */}
                              <div
                                className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium border ${TRAFFIC_SEVERITY_COLORS[severity]}`}
                              >
                                {severity.charAt(0).toUpperCase() +
                                  severity.slice(1)}
                              </div>
                            </div>

                            {/* Traffic Counts and Severity Values - Full width on mobile */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-2 pl-11 sm:pl-0">
                              <div className="text-center">
                                <div className="text-base sm:text-lg font-bold text-traffic-yellow">
                                  {cell.yellow}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Yellow
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-base sm:text-lg font-bold text-traffic-red">
                                  {cell.red}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Red
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-base sm:text-lg font-bold text-traffic-dark-red">
                                  {cell.dark_red}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Dark Red
                                </div>
                              </div>

                              {/* Google Maps Link - inline on mobile */}
                              <a
                                href={getGoogleMapsUrl(
                                  getCellCenterCoordinates(cell.x, cell.y).lat,
                                  getCellCenterCoordinates(cell.x, cell.y).lng,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1 bg-primary text-primary-foreground rounded-full sm:rounded hover:bg-primary/90 transition-colors text-xs font-medium"
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
                                <span className="hidden sm:inline sm:ml-2">
                                  View on Maps
                                </span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No congested areas data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="severity">
            <div className="space-y-3">
              <Suspense
                fallback={
                  <div className="h-12 bg-muted/20 animate-pulse rounded-lg" />
                }
              >
                <div className="mt-3">
                  <StatsBar data={currentData || []} mode="severity" />
                </div>
              </Suspense>
              <Suspense
                fallback={
                  <div className="aspect-[15/21] bg-muted/20 animate-pulse rounded-lg" />
                }
              >
                <FullTrafficGrid
                  data={currentData || []}
                  rows={21}
                  cols={15}
                  mode="severity"
                  highlightTop10={true}
                />
              </Suspense>

              {/* Top 10 Severity Areas Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Top 10 Severity Anomalies
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Areas with highest severity above historical thresholds
                    </p>
                  </div>
                </div>

                {/* Severity Areas List */}
                <div className="space-y-2">
                  {topSeverityAreas && topSeverityAreas.length > 0 ? (
                    topSeverityAreas.map((area, index) => {
                      return (
                        <div
                          key={`${area.x}-${area.y}`}
                          className="bg-card border border-border rounded-lg p-3 sm:p-4"
                        >
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
                                  Grid [{area.x}, {area.y}]
                                </div>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    Severity:{" "}
                                    <span className="font-bold">
                                      {area.latest_severity?.toFixed(0)}
                                    </span>
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    P95:{" "}
                                    <span className="font-bold">
                                      {area.p95?.toFixed(0) || "N/A"}
                                    </span>
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    P99:{" "}
                                    <span className="font-bold">
                                      {area.p99?.toFixed(0) || "N/A"}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              {/* Severity Badge */}
                              <div
                                className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium border ${SEVERITY_LEVEL_COLORS[area.severityLevel as keyof typeof SEVERITY_LEVEL_COLORS]}`}
                              >
                                {area.severityLevel.charAt(0).toUpperCase() +
                                  area.severityLevel.slice(1)}
                              </div>
                            </div>

                            {/* Traffic Counts - Full width on mobile */}
                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-3 pl-11 sm:pl-0">
                              <div className="text-center">
                                <div className="text-base sm:text-lg font-bold text-traffic-yellow">
                                  {area.yellow}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Yellow
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-base sm:text-lg font-bold text-traffic-red">
                                  {area.red}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Red
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-base sm:text-lg font-bold text-traffic-dark-red">
                                  {area.dark_red}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Dark Red
                                </div>
                              </div>

                              {/* Google Maps Link */}
                              <a
                                href={getGoogleMapsUrl(
                                  getCellCenterCoordinates(area.x, area.y).lat,
                                  getCellCenterCoordinates(area.x, area.y).lng,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1 bg-primary text-primary-foreground rounded-full sm:rounded hover:bg-primary/90 transition-colors text-xs font-medium"
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
                                <span className="hidden sm:inline sm:ml-2">
                                  View on Maps
                                </span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No severity anomalies data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border py-1 mt-3">
        <div className="container text-center text-xs text-muted-foreground">
          Traffic Dashboard • Connected to Neon Postgres (readonly)
        </div>
      </footer>
    </div>
  );
}
