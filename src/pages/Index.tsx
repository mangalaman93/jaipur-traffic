import { useState, lazy, Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TrafficAreaCard } from "@/components/TrafficAreaCard";
import { TrafficData } from "@/types/traffic";
import Activity from "lucide-react/dist/esm/icons/activity";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import Clock from "lucide-react/dist/esm/icons/clock";
import { parseISTTimestamp } from "@/utils/timeUtils";
import {
  calculateSeverityDifferences,
} from "@/utils/trafficUtils";

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
  const [selectedCell, setSelectedCell] = useState<TrafficData | null>(null);

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

  const { data: sustainedData } = useQuery({
    queryKey: ["sustainedTraffic"],
    queryFn: async () => {
      const response = await fetch(
        "https://traffic-worker.mangalaman93.workers.dev/sustained",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sustained traffic data");
      }
      const data = await response.json();
      return data as TrafficData[];
    },
  });

  // Calculate Top 10 severity areas based on P99-first, P95-fallback logic
  const topSeverityAreas = useMemo(() => {
    if (!currentData) return [];

    const processedData = currentData
      .filter((cell) => cell.latest_severity && cell.p95 && cell.p99)
      .map((cell) => {
        const { p95Diff, p99Diff } = calculateSeverityDifferences(cell);
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
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="traffic" className="gap-2">
              <Activity className="w-4 h-4" />
              Traffic Analysis
            </TabsTrigger>
            <TabsTrigger value="severity" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Severity Analysis
            </TabsTrigger>
            <TabsTrigger value="sustained" className="gap-2">
              <Clock className="w-4 h-4" />
              Sustained Traffic
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
                  initialSelectedCell={selectedCell}
                  activeTab={activeTab}
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
                    congestedData.slice(0, 10).map((cell, index) => (
                      <TrafficAreaCard
                        key={`${cell.x}-${cell.y}`}
                        cell={cell}
                        index={index}
                        severityColors={TRAFFIC_SEVERITY_COLORS}
                        onDetailsClick={setSelectedCell}
                      />
                    ))
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
                  initialSelectedCell={selectedCell}
                  activeTab={activeTab}
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
                    topSeverityAreas.map((area, index) => (
                      <TrafficAreaCard
                        key={`${area.x}-${area.y}`}
                        cell={area}
                        index={index}
                        severityLevelColors={SEVERITY_LEVEL_COLORS}
                        onDetailsClick={setSelectedCell}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No severity anomalies data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sustained">
            <div className="space-y-3">
              <Suspense
                fallback={
                  <div className="h-12 bg-muted/20 animate-pulse rounded-lg" />
                }
              >
                <div className="mt-3">
                  <StatsBar data={sustainedData || []} />
                </div>
              </Suspense>
              <Suspense
                fallback={
                  <div className="aspect-[15/21] bg-muted/20 animate-pulse rounded-lg" />
                }
              >
                <FullTrafficGrid
                  data={sustainedData || []}
                  rows={21}
                  cols={15}
                  highlightTop10={true}
                  initialSelectedCell={selectedCell}
                  activeTab={activeTab}
                />
              </Suspense>

              {/* Sustained Traffic Areas Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Sustained Traffic Areas
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Areas with persistent high traffic levels
                    </p>
                  </div>
                </div>

                {/* Sustained Areas List */}
                <div className="space-y-2">
                  {sustainedData && sustainedData.length > 0 ? (
                    sustainedData.slice(0, 10).map((cell, index) => (
                      <TrafficAreaCard
                        key={`${cell.x}-${cell.y}`}
                        cell={cell}
                        index={index}
                        showThresholdP95={true}
                        severityColors={TRAFFIC_SEVERITY_COLORS}
                        onDetailsClick={setSelectedCell}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No sustained traffic data available</p>
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
