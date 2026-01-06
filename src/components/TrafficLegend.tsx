interface TrafficLegendProps {
  mode: "traffic" | "severity";
}

export function TrafficLegend({ mode }: TrafficLegendProps) {
  if (mode === "severity") {
    return (
      <>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-muted/20 border border-border/50" />
          <span className="text-muted-foreground">Normal (≤ P95)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-yellow-600/40 border border-yellow-600" />
          <span className="text-muted-foreground">
            Moderate (&gt; P95, ≤ P99)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-red-600/50 border border-red-600" />
          <span className="text-muted-foreground">High (&gt; P99)</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-muted/20 border border-border/50" />
        <span className="text-muted-foreground">Normal</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-traffic-yellow/40 border border-traffic-yellow" />
        <span className="text-muted-foreground">Moderate</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-traffic-red/50 border border-traffic-red" />
        <span className="text-muted-foreground">High</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-traffic-dark-red/60 border border-traffic-dark-red" />
        <span className="text-muted-foreground">Critical</span>
      </div>
    </>
  );
}
