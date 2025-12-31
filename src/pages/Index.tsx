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
import { calculateSeverityDifferences } from "@/utils/trafficUtils";
import {
  TRAFFIC_SEVERITY_COLORS,
  SEVERITY_LEVEL_COLORS,
  API_ENDPOINTS,
} from "@/constants/traffic";

const FullTrafficGrid = lazy(() =>
  import("@/components/FullTrafficGrid").then((m) => ({
    default: m.FullTrafficGrid,
  })),
);
const StatsBar = lazy(() =>
  import("@/components/StatsBar").then((m) => ({ default: m.StatsBar })),
);

const getTopSeverityAreas = (currentData: TrafficData[]) => {
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

  const p99Cells = processedData
    .filter((cell) => cell.p99Diff > 0)
    .sort((a, b) => b.p99Diff - a.p99Diff)
    .slice(0, 10);

  if (p99Cells.length >= 10) {
    return p99Cells;
  }

  const p95Cells = processedData
    .filter((cell) => cell.p95Diff > 0 && cell.p99Diff <= 0)
    .sort((a, b) => b.p95Diff - a.p95Diff)
    .slice(0, 10 - p99Cells.length);

  return [...p99Cells, ...p95Cells].slice(0, 10);
};

const getLastUpdated = (currentData: TrafficData[] | undefined): Date => {
  if (!currentData || currentData.length === 0) return new Date();

  return parseISTTimestamp(
    currentData.reduce(
      (max, d) => (new Date(d.ts) > new Date(max.ts) ? d : max),
      currentData[0],
    ).ts,
  );
};

export default function Index() {
  const [activeTab, setActiveTab] = useState("traffic");
  const [selectedCell, setSelectedCell] = useState<TrafficData | null>(null);

  const { data: currentData } = useQuery({
    queryKey: ["currentTraffic"],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.CURRENT);
      if (!response.ok) {
        throw new Error("Failed to fetch current traffic data");
      }
      const data = await response.json();
      return data as TrafficData[];
    },
  });

  const congestedData = currentData;

  const { data: sustainedData } = useQuery({
    queryKey: ["sustainedTraffic"],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.SUSTAINED);
      if (!response.ok) {
        throw new Error("Failed to fetch sustained traffic data");
      }
      const data = await response.json();
      return data as TrafficData[];
    },
  });

  const topSeverityAreas = useMemo(() => getTopSeverityAreas(currentData || []), [currentData]);

  const lastUpdated = useMemo(() => getLastUpdated(currentData), [currentData]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader lastUpdated={lastUpdated} />

      <main className="container py-2 space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3 h-auto sm:h-10 p-1 sm:p-1">
            <TabsTrigger
              value="traffic"
              className="gap-1 sm:gap-2 flex-col sm:flex-row px-2 py-2 sm:px-3 sm:py-1.5 min-h-[3rem] sm:min-h-0"
            >
              <Activity className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm leading-tight text-center">Traffic Analysis</span>
            </TabsTrigger>
            <TabsTrigger
              value="severity"
              className="gap-1 sm:gap-2 flex-col sm:flex-row px-2 py-2 sm:px-3 sm:py-1.5 min-h-[3rem] sm:min-h-0"
            >
              <BarChart3 className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm leading-tight text-center">Severity Analysis</span>
            </TabsTrigger>
            <TabsTrigger
              value="sustained"
              className="gap-1 sm:gap-2 flex-col sm:flex-row px-2 py-2 sm:px-3 sm:py-1.5 min-h-[3rem] sm:min-h-0"
            >
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm leading-tight text-center">Sustained Traffic</span>
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
                    congestedData
                      .slice(0, 10)
                      .map((cell, index) => (
                        <TrafficAreaCard
                          key={`${cell.x}-${cell.y}`}
                          cell={cell}
                          index={index}
                          severityColors={TRAFFIC_SEVERITY_COLORS}
                          onDetailsClick={() => setSelectedCell(cell)}
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
                        onDetailsClick={() => setSelectedCell(area)}
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
                    sustainedData
                      .slice(0, 10)
                      .map((cell, index) => (
                        <TrafficAreaCard
                          key={`${cell.x}-${cell.y}`}
                          cell={cell}
                          index={index}
                          showThresholdP95={true}
                          severityColors={TRAFFIC_SEVERITY_COLORS}
                          onDetailsClick={() => setSelectedCell(cell)}
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
