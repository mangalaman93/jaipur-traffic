import { useState, lazy, Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TrafficAreaCard } from "@/components/TrafficAreaCard";
import { TrafficData } from "@/lib/types";
import {
  validateCurrentTrafficData,
  validateSustainedTrafficData,
} from "@/lib/validation";
import { parseISTTimestamp } from "@/lib/timeUtils";
import {
  calculateSeverityDifferences,
  calculateTotalTraffic,
} from "@/lib/trafficUtils";
import {
  TRAFFIC_SEVERITY_COLORS,
  SEVERITY_LEVEL_COLORS,
  API_ENDPOINTS,
  GRID_DIMENSIONS,
} from "@/lib/constants";

// Lazy loaded components
const FullTrafficGrid = lazy(() =>
  import("@/components/FullTrafficGrid").then((m) => ({
    default: m.FullTrafficGrid,
  })),
);

const StatsBar = lazy(() =>
  import("@/components/StatsBar").then((m) => ({ default: m.StatsBar })),
);

// Utility functions
const getSeverityLevel = (
  cell: TrafficData,
): "high" | "moderate" | "normal" => {
  if (!cell.latest_severity || !cell.p95 || !cell.p99) return "normal";

  if (cell.latest_severity > cell.p99!) return "high";
  if (cell.latest_severity > cell.p95!) return "moderate";
  return "normal";
};

const getTopSeverityAreas = (currentData: TrafficData[]): TrafficData[] => {
  if (!currentData) return [];

  const processedData = currentData
    .filter((cell) => cell.latest_severity && cell.p95 && cell.p99)
    .map((cell) => {
      const { p95Diff, p99Diff } = calculateSeverityDifferences(cell);
      return {
        ...cell,
        p95Diff,
        p99Diff,
        severityLevel: getSeverityLevel(cell),
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

const getTopCongestedAreas = (currentData: TrafficData[]): TrafficData[] => {
  if (!currentData) return [];

  return currentData
    .filter((cell) => calculateTotalTraffic(cell) > 0)
    .sort((a, b) => calculateTotalTraffic(b) - calculateTotalTraffic(a))
    .slice(0, 10);
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

const TopAreasList = ({
  areas,
  title,
  description,
  emptyMessage,
  severityColors,
  severityLevelColors,
  showThresholdP95,
}: {
  areas: TrafficData[];
  title: string;
  description: string;
  emptyMessage: string;
  severityColors?: typeof TRAFFIC_SEVERITY_COLORS;
  severityLevelColors?: typeof SEVERITY_LEVEL_COLORS;
  showThresholdP95?: boolean;
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="space-y-2">
      {areas && areas.length > 0 ? (
        areas.map((cell, index) => (
          <TrafficAreaCard
            key={`${cell.x}-${cell.y}`}
            cell={cell}
            index={index}
            severityColors={severityColors}
            severityLevelColors={severityLevelColors}
            showThresholdP95={showThresholdP95}
          />
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  </div>
);

interface TabContentProps {
  data: TrafficData[];
  mode?: "traffic" | "severity";
}

const TabContent = ({ data, mode }: TabContentProps) => (
  <div className="space-y-4">
    <Suspense
      fallback={<div className="h-12 bg-muted/20 animate-pulse rounded-lg" />}
    >
      <div className="mb-3">
        <StatsBar data={data} mode={mode} />
      </div>
    </Suspense>
    <Suspense
      fallback={
        <div
          className={`aspect-[${GRID_DIMENSIONS.COLS}/${GRID_DIMENSIONS.ROWS}] bg-muted/20 animate-pulse rounded-lg`}
        />
      }
    />
  </div>
);

export default function Index() {
  const [activeTab, setActiveTab] = useState("traffic");

  const {
    data: currentData,
    isLoading: isLoadingCurrent,
    error: currentError,
  } = useQuery({
    queryKey: ["currentTraffic"],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.CURRENT);
      if (!response.ok) {
        throw new Error("Failed to fetch current traffic data");
      }
      const data = await response.json();
      return validateCurrentTrafficData(data) as TrafficData[];
    },
  });

  const {
    data: sustainedData,
    isLoading: isLoadingSustained,
    error: sustainedError,
  } = useQuery({
    queryKey: ["sustainedTraffic"],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.SUSTAINED);
      if (!response.ok) {
        throw new Error("Failed to fetch sustained traffic data");
      }
      const data = await response.json();
      return validateSustainedTrafficData(data) as TrafficData[];
    },
  });

  const topSeverityAreas = useMemo(
    () => getTopSeverityAreas(currentData || []),
    [currentData],
  );
  const topCongestedAreas = useMemo(
    () => getTopCongestedAreas(currentData || []),
    [currentData],
  );

  const lastUpdated = useMemo(() => getLastUpdated(currentData), [currentData]);

  // Show loading state
  if (isLoadingCurrent || isLoadingSustained) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"
                role="status"
                aria-label="Loading"
              >
                <span className="sr-only">Loading...</span>
              </div>
              <p className="text-muted-foreground">Loading traffic data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (currentError || sustainedError) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4 max-w-md">
              <div className="text-red-600 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Error Loading Data
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentError?.message ||
                  sustainedError?.message ||
                  "Failed to load traffic data. Please try again later."}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                aria-label="Retry loading traffic data"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        lastUpdated={lastUpdated}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="container py-2 space-y-3">
        {/* Tabs moved to header */}
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="traffic">
            <TabContent data={currentData || []} mode="traffic" />
            <Suspense
              fallback={
                <div
                  className={`aspect-[${GRID_DIMENSIONS.COLS}/${GRID_DIMENSIONS.ROWS}] bg-muted/20 animate-pulse rounded-lg`}
                />
              }
            >
              <FullTrafficGrid
                data={currentData || []}
                mode="traffic"
                highlightTop10={true}
                topAreasList={
                  <TopAreasList
                    areas={topCongestedAreas}
                    title="Top 10 Congested Areas"
                    description="Most congested traffic areas right now"
                    emptyMessage="No congested areas data available"
                    severityColors={TRAFFIC_SEVERITY_COLORS}
                  />
                }
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="severity">
            <TabContent data={currentData || []} mode="severity" />
            <Suspense
              fallback={
                <div
                  className={`aspect-[${GRID_DIMENSIONS.COLS}/${GRID_DIMENSIONS.ROWS}] bg-muted/20 animate-pulse rounded-lg`}
                />
              }
            >
              <FullTrafficGrid
                data={currentData || []}
                mode="severity"
                highlightTop10={true}
                topAreasList={
                  <TopAreasList
                    areas={topSeverityAreas}
                    title="Top 10 Severity Anomalies"
                    description="Areas with highest severity above historical thresholds"
                    emptyMessage="No severity anomalies data available"
                    severityLevelColors={SEVERITY_LEVEL_COLORS}
                  />
                }
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="sustained">
            <TabContent data={sustainedData || []} />
            <Suspense
              fallback={
                <div
                  className={`aspect-[${GRID_DIMENSIONS.COLS}/${GRID_DIMENSIONS.ROWS}] bg-muted/20 animate-pulse rounded-lg`}
                />
              }
            >
              <FullTrafficGrid
                data={sustainedData || []}
                highlightTop10={true}
                topAreasList={
                  <TopAreasList
                    areas={(sustainedData || []).slice(0, 10)}
                    title="Sustained Traffic Areas"
                    description="Areas with persistent high traffic levels"
                    emptyMessage="No sustained traffic data available"
                    showThresholdP95={true}
                    severityColors={TRAFFIC_SEVERITY_COLORS}
                  />
                }
              />
            </Suspense>
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
