import { TrafficData } from "@/types/traffic";

interface StatsBarProps {
  data: TrafficData[];
}

export function StatsBar({ data }: StatsBarProps) {
  const stats = {
    total: data.length,
    critical: data.filter(d => d.dark_red > 0).length,
    high: data.filter(d => d.red > 0 && d.dark_red === 0).length,
    moderate: data.filter(d => d.yellow > 0 && d.red === 0 && d.dark_red === 0).length,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="text-xs text-muted-foreground mb-1">Total Grids</div>
        <div className="text-2xl font-bold font-mono text-foreground">
          {stats.total}
        </div>
      </div>
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
    </div>
  );
}
