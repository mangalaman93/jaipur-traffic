import { TrafficData } from "@/lib/types";

interface SeverityInfoProps {
  selectedCell: TrafficData | null;
  activeTab: string;
}

export function SeverityInfo({ selectedCell, activeTab }: SeverityInfoProps) {
  if (!selectedCell) {
    return <div className="text-center p-4 text-muted-foreground">No cell selected</div>;
  }

  return (
    <div className={`grid gap-4 ${activeTab === "sustained" ? "grid-cols-2" : "grid-cols-3"}`}>
      <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/50">
        <div className="text-2xl font-bold text-foreground">
          {selectedCell.latest_severity?.toFixed(0) || "N/A"}
        </div>
        <div className="text-xs text-muted-foreground">Latest Severity</div>
      </div>
      {activeTab === "sustained" ? (
        <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/50">
          <div className="text-2xl font-bold text-muted-foreground">
            {selectedCell.threshold_p95?.toFixed(0) || "N/A"}
          </div>
          <div className="text-xs text-muted-foreground">Threshold P95</div>
        </div>
      ) : (
        <>
          <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/50">
            <div className="text-2xl font-bold text-muted-foreground">
              {selectedCell.p95?.toFixed(0) || "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">P95</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/50">
            <div className="text-2xl font-bold text-muted-foreground">
              {selectedCell.p99?.toFixed(0) || "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">P99</div>
          </div>
        </>
      )}
    </div>
  );
}
