import { useState, lazy, Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TrafficAreaCard } from "@/components/TrafficAreaCard";
import { TrafficData } from "@/lib/types";
import { validateTrafficData } from "@/lib/validation";
import { Activity, BarChart3, Clock } from "lucide-react";
import { parseISTTimestamp } from "@/lib/timeUtils";
import { calculateSeverityDifferences, calculateTotalTraffic } from "@/lib/trafficUtils";
import { cn } from "@/lib/cn";
import {
  TRAFFIC_SEVERITY_COLORS,
  SEVERITY_LEVEL_COLORS,
  API_ENDPOINTS,
  GRID_DIMENSIONS,
} from "@/lib/constants";

// Lazy loaded components
const FullTrafficGrid = lazy(() =>
  import("@/components/FullTrafficGrid").then(m => ({
    default: m.FullTrafficGrid,
  }))
);

const StatsBar = lazy(() => import("@/components/StatsBar").then(m => ({ default: m.StatsBar })));

// Utility functions
const getSeverityLevel = (cell: TrafficData): "high" | "moderate" | "normal" => {
  if (!cell.latest_severity || !cell.p95 || !cell.p99) return "normal";

  if (cell.latest_severity > cell.p99!) return "high";
  if (cell.latest_severity > cell.p95!) return "moderate";
  return "normal";
};

const getTopSeverityAreas = (currentData: TrafficData[]): TrafficData[] => {
  if (!currentData) return [];

  const processedData = currentData
    .filter(cell => cell.latest_severity && cell.p95 && cell.p99)
    .map(cell => {
      const { p95Diff, p99Diff } = calculateSeverityDifferences(cell);
      return {
        ...cell,
        p95Diff,
        p99Diff,
        severityLevel: getSeverityLevel(cell),
      };
    });

  const p99Cells = processedData
    .filter(cell => cell.p99Diff > 0)
    .sort((a, b) => b.p99Diff - a.p99Diff)
    .slice(0, 10);

  if (p99Cells.length >= 10) {
    return p99Cells;
  }

  const p95Cells = processedData
    .filter(cell => cell.p95Diff > 0 && cell.p99Diff <= 0)
    .sort((a, b) => b.p95Diff - a.p95Diff)
    .slice(0, 10 - p99Cells.length);

  return [...p99Cells, ...p95Cells].slice(0, 10);
};

const getTopCongestedAreas = (currentData: TrafficData[]): TrafficData[] => {
  if (!currentData) return [];

  return currentData
    .filter(cell => calculateTotalTraffic(cell) > 0)
    .sort((a, b) => calculateTotalTraffic(b) - calculateTotalTraffic(a))
    .slice(0, 10);
};

const getLastUpdated = (currentData: TrafficData[] | undefined): Date => {
  if (!currentData || currentData.length === 0) return new Date();

  return parseISTTimestamp(
    currentData.reduce((max, d) => (new Date(d.ts) > new Date(max.ts) ? d : max), currentData[0]).ts
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
  onDetailsClick,
}: {
  areas: TrafficData[];
  title: string;
  description: string;
  emptyMessage: string;
  severityColors?: typeof TRAFFIC_SEVERITY_COLORS;
  severityLevelColors?: typeof SEVERITY_LEVEL_COLORS;
  showThresholdP95?: boolean;
  onDetailsClick: (cell: TrafficData) => void;
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
            onDetailsClick={() => onDetailsClick(cell)}
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
  highlightTop10?: boolean;
  activeTab?: string;
  selectedCell?: TrafficData | null;
  setSelectedCell?: (cell: TrafficData | null) => void;
  children: React.ReactNode;
}

const TabContent = ({
  data,
  mode,
  highlightTop10,
  activeTab,
  selectedCell,
  setSelectedCell,
  children,
}: TabContentProps) => (
  <div className="space-y-3">
    <Suspense fallback={<div className="h-12 bg-muted/20 animate-pulse rounded-lg" />}>
      <div className="mt-3">
        <StatsBar data={data} mode={mode} />
      </div>
    </Suspense>
    <Suspense
      fallback={
        <div
          className={
            "aspect-[" +
            GRID_DIMENSIONS.COLS +
            "/" +
            GRID_DIMENSIONS.ROWS +
            "] bg-muted/20 animate-pulse rounded-lg"
          }
        />
      }
    >
      <FullTrafficGrid
        data={data}
        rows={GRID_DIMENSIONS.ROWS}
        cols={GRID_DIMENSIONS.COLS}
        mode={mode}
        highlightTop10={highlightTop10}
        initialSelectedCell={selectedCell}
        activeTab={activeTab}
        onDialogClose={() => setSelectedCell?.(null)}
      />
    </Suspense>
    {children}
  </div>
);

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
      return validateTrafficData(data) as TrafficData[];
    },
  });

  const { data: sustainedData } = useQuery({
    queryKey: ["sustainedTraffic"],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.SUSTAINED);
      if (!response.ok) {
        throw new Error("Failed to fetch sustained traffic data");
      }
      const data = await response.json();
      return validateTrafficData(data) as TrafficData[];
    },
  });

  const topSeverityAreas = useMemo(() => getTopSeverityAreas(currentData || []), [currentData]);
  const topCongestedAreas = useMemo(() => getTopCongestedAreas(currentData || []), [currentData]);

  const lastUpdated = useMemo(() => getLastUpdated(currentData), [currentData]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader lastUpdated={lastUpdated} />

      <main className="container py-2 space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3 h-auto sm:h-10 p-1 sm:p-1">
            <TabsTrigger
              value="traffic"
              className={cn(
                "gap-1 sm:gap-2 flex-col sm:flex-row",
                "px-2 py-2 sm:px-3 sm:py-1.5",
                "min-h-[3rem] sm:min-h-0"
              )}
            >
              <Activity className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm leading-tight text-center">Traffic Analysis</span>
            </TabsTrigger>
            <TabsTrigger
              value="severity"
              className={cn(
                "gap-1 sm:gap-2 flex-col sm:flex-row",
                "px-2 py-2 sm:px-3 sm:py-1.5",
                "min-h-[3rem] sm:min-h-0"
              )}
            >
              <BarChart3 className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm leading-tight text-center">
                Severity Analysis
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="sustained"
              className={cn(
                "gap-1 sm:gap-2 flex-col sm:flex-row",
                "px-2 py-2 sm:px-3 sm:py-1.5",
                "min-h-[3rem] sm:min-h-0"
              )}
            >
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm leading-tight text-center">
                Sustained Traffic
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traffic">
            <TabContent
              data={currentData || []}
              highlightTop10={true}
              activeTab={activeTab}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
            >
              <TopAreasList
                areas={topCongestedAreas}
                title="Top 10 Congested Areas"
                description="Most congested traffic areas right now"
                emptyMessage="No congested areas data available"
                severityColors={TRAFFIC_SEVERITY_COLORS}
                onDetailsClick={setSelectedCell}
              />
            </TabContent>
          </TabsContent>

          <TabsContent value="severity">
            <TabContent
              data={currentData || []}
              mode="severity"
              highlightTop10={true}
              activeTab={activeTab}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
            >
              <TopAreasList
                areas={topSeverityAreas}
                title="Top 10 Severity Anomalies"
                description="Areas with highest severity above historical thresholds"
                emptyMessage="No severity anomalies data available"
                severityLevelColors={SEVERITY_LEVEL_COLORS}
                onDetailsClick={setSelectedCell}
              />
            </TabContent>
          </TabsContent>

          <TabsContent value="sustained">
            <TabContent
              data={sustainedData || []}
              highlightTop10={true}
              activeTab={activeTab}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
            >
              <TopAreasList
                areas={(sustainedData || []).slice(0, 10)}
                title="Sustained Traffic Areas"
                description="Areas with persistent high traffic levels"
                emptyMessage="No sustained traffic data available"
                showThresholdP95={true}
                severityColors={TRAFFIC_SEVERITY_COLORS}
                onDetailsClick={setSelectedCell}
              />
            </TabContent>
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
