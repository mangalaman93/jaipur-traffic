import { TooltipPayload } from "./ChartConfig";
import { formatDetailedTime } from "@/lib/timeFormat";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TooltipPayload }>;
}

export function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  const metrics = [
    { label: "Yellow", value: data.yellow },
    { label: "Red", value: data.red },
    { label: "Dark Red", value: data.dark_red },
    { label: "Total", value: data.total, highlight: true },
    { label: "Latest Severity", value: data.latest_severity.toFixed(2) },
  ];

  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
      <div className="text-xs font-medium text-foreground mb-2">
        {formatDetailedTime(data.timestamp)}
      </div>
      <div className="space-y-1">
        {metrics.map(({ label, value, highlight }) => (
          <div
            key={label}
            className={`flex justify-between gap-4 text-xs ${
              highlight ? "font-medium border-t border-border/50 pt-1" : ""
            }`}
          >
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-mono">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
