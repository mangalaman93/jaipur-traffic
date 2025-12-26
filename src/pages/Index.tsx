import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TrafficData } from "@/types/traffic";
import { FullTrafficGrid } from "@/components/FullTrafficGrid";
import { StatsBar } from "@/components/StatsBar";
import { Activity, TrendingUp } from "lucide-react";
import { parseISTTimestamp } from "@/utils/timeUtils";

export default function Index() {
  const [activeTab, setActiveTab] = useState("current");

  const { data: currentData, isLoading: currentLoading, refetch: refetchCurrent } = useQuery({
    queryKey: ["currentTraffic"],
    queryFn: async () => {
      const response = await fetch("https://traffic-worker.mangalaman93.workers.dev/current");
      if (!response.ok) {
        throw new Error("Failed to fetch current traffic data");
      }
      const data = await response.json();
      return data as TrafficData[];
    },
  });

  const { data: congestedData, isLoading: congestedLoading, refetch: refetchCongested } = useQuery({
    queryKey: ["congestedTraffic"],
    queryFn: async () => {
      const response = await fetch("https://traffic-worker.mangalaman93.workers.dev/congested");
      if (!response.ok) {
        throw new Error("Failed to fetch congested traffic data");
      }
      const data = await response.json();
      return data as TrafficData[];
    },
  });

  const displayData = activeTab === "current" ? currentData : congestedData;
  const isLoading = activeTab === "current" ? currentLoading : congestedLoading;
  const lastUpdated = displayData && displayData.length > 0
    ? parseISTTimestamp(displayData[0].ts)
    : new Date();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        lastUpdated={lastUpdated}
      />

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

          <div className="mt-3">
            <StatsBar data={displayData || []} />
          </div>

          <TabsContent value="current">
            <FullTrafficGrid data={currentData || []} rows={21} cols={15} />
          </TabsContent>

          <TabsContent value="congested">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Top 10 Congested Areas</h2>
                  <p className="text-sm text-muted-foreground">
                    Most congested traffic areas right now
                  </p>
                </div>
              </div>
              <FullTrafficGrid data={congestedData || []} rows={21} cols={15} />
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
