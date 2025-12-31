import { TrafficData } from "@/types/traffic";

interface StatsBarProps {
  data: TrafficData[];
  mode?: "traffic" | "severity";
}

// Helper function to determine severity level (same as in FullTrafficGrid)
const getSeverityLevel = (
  cell: TrafficData | undefined,
): "normal" | "moderate" | "high" => {
  if (!cell || !cell.latest_severity || !cell.p95 || !cell.p99) return "normal";

  // Handle case when all values are 0
  if (cell.latest_severity === 0 && cell.p95 === 0 && cell.p99 === 0)
    return "normal";

  if (cell.latest_severity > cell.p99) return "high";
  if (cell.latest_severity > cell.p95) return "moderate";
  return "normal";
};

export function StatsBar({ data, mode = "traffic" }: StatsBarProps) {
  const stats =
    mode === "severity"
      ? {
          total: data.length,
          high: data.filter((d) => getSeverityLevel(d) === "high").length,
          moderate: data.filter((d) => getSeverityLevel(d) === "moderate")
            .length,
          normal: data.filter((d) => getSeverityLevel(d) === "normal").length,
        }
      : {
          total: data.length,
          critical: data.filter((d) => d.dark_red > 0).length,
          high: data.filter((d) => d.red > 0 && d.dark_red === 0).length,
          moderate: data.filter(
            (d) => d.yellow > 0 && d.red === 0 && d.dark_red === 0,
          ).length,
        };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="text-xs text-muted-foreground mb-1">Total Grids</div>
        <div className="text-2xl font-bold font-mono text-foreground">
          {stats.total}
        </div>
      </div>
      {mode === "severity" ? (
        <>
          <div className="bg-card rounded-lg p-4 border border-red-600/30">
            <div className="text-xs text-muted-foreground mb-1">
              High (&gt; P99)
            </div>
            <div className="text-2xl font-bold font-mono text-red-600">
              {stats.high}
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-yellow-600/30">
            <div className="text-xs text-muted-foreground mb-1">
              Moderate (&gt; P95)
            </div>
            <div className="text-2xl font-bold font-mono text-yellow-600">
              {stats.moderate}
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border/50">
            <div className="text-xs text-muted-foreground mb-1">
              Normal (≤ P95)
            </div>
            <div className="text-2xl font-bold font-mono text-muted-foreground">
              {stats.normal}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-card rounded-lg p-4 border border-traffic-dark-red/30">
            <div className="text-xs text-muted-foreground mb-1">Critical</div>
            <div className="text-2xl font-bold font-mono text-traffic-dark-red">
              {stats.critical}
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-traffic-red/30">
            <div className="text-xs text-muted-foreground mb-1">High</div>
            <div className="text-2xl font-bold font-mono text-traffic-red">
              {stats.high}
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-traffic-yellow/30">
            <div className="text-xs text-muted-foreground mb-1">Moderate</div>
            <div className="text-2xl font-bold font-mono text-traffic-yellow">
              {stats.moderate}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
