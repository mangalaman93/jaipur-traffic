import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TrafficData } from "@/types/traffic";
import { Activity, TrendingUp } from "lucide-react";
import { parseISTTimestamp } from "@/utils/timeUtils";
import {
  getCellCenterCoordinates,
  getGoogleMapsUrl,
} from "@/utils/coordinateUtils";

// Lazy load heavy components
const FullTrafficGrid = lazy(() => import("@/components/FullTrafficGrid").then(m => ({ default: m.FullTrafficGrid })));
const StatsBar = lazy(() => import("@/components/StatsBar").then(m => ({ default: m.StatsBar })));

export default function Index() {
  const [activeTab, setActiveTab] = useState("current");

  const { data: currentData } = useQuery({
    queryKey: ["currentTraffic"],
    queryFn: async () => {
      const response = await fetch(
        "https://traffic-worker.mangalaman93.workers.dev/current"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch current traffic data");
      }
      const data = await response.json();
      return data as TrafficData[];
    },
  });

  const { data: congestedData } = useQuery({
    queryKey: ["congestedTraffic"],
    queryFn: async () => {
      const response = await fetch(
        "https://traffic-worker.mangalaman93.workers.dev/congested"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch congested traffic data");
      }
      const data = await response.json();
      return data as TrafficData[];
    },
  });

  const displayData = activeTab === "current" ? currentData : congestedData;
  const lastUpdated =
    displayData && displayData.length > 0
      ? parseISTTimestamp(displayData[0].ts)
      : new Date();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader lastUpdated={lastUpdated} />

      <main className="container py-2 space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="current" className="gap-2">
              <Activity className="w-4 h-4" />
              Current Traffic
            </TabsTrigger>
            <TabsTrigger value="congested" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Top 10 Congested
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <div className="space-y-3">
              <Suspense fallback={<div className="h-12 bg-muted/20 animate-pulse rounded-lg" />}>
                <div className="mt-3">
                  <StatsBar data={currentData || []} />
                </div>
              </Suspense>
              <Suspense fallback={<div className="aspect-[15/21] bg-muted/20 animate-pulse rounded-lg" />}>
                <FullTrafficGrid data={currentData || []} rows={21} cols={15} />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="congested">
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
                    const totalTraffic = cell.yellow + cell.red + cell.dark_red;
                    const severity =
                      cell.dark_red > 0
                        ? "critical"
                        : cell.red > 0
                          ? "high"
                          : "medium";
                    const severityColors = {
                      critical:
                        "bg-traffic-dark-red/20 border-traffic-dark-red/50 text-traffic-dark-red",
                      high: "bg-traffic-red/20 border-traffic-red/50 text-traffic-red",
                      medium:
                        "bg-traffic-yellow/20 border-traffic-yellow/50 text-traffic-yellow",
                    };

                    return (
                      <div
                        key={`${cell.x}-${cell.y}`}
                        className="bg-card border border-border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {index + 1}
                            </div>

                            {/* Grid Info */}
                            <div>
                              <div className="font-mono text-sm font-medium">
                                Grid [{cell.x}, {cell.y}]
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Total: {totalTraffic}
                              </div>
                            </div>

                            {/* Severity Badge */}
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${severityColors[severity]}`}
                            >
                              {severity.charAt(0).toUpperCase() +
                                severity.slice(1)}
                            </div>
                          </div>

                          {/* Traffic Counts */}
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-traffic-yellow">
                                {cell.yellow}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Yellow
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-traffic-red">
                                {cell.red}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Red
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-traffic-dark-red">
                                {cell.dark_red}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Dark Red
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Google Maps Link */}
                        <div className="mt-3 pt-3 border-t border-border">
                          <a
                            href={getGoogleMapsUrl(
                              getCellCenterCoordinates(cell.x, cell.y).lat,
                              getCellCenterCoordinates(cell.x, cell.y).lng
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-xs font-medium"
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
                            View on Google Maps
                          </a>
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
