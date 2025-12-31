export const CHART_COLORS = {
  yellow: "hsl(var(--traffic-yellow))",
  red: "hsl(var(--traffic-red))",
  dark_red: "hsl(var(--traffic-dark-red))",
  total: "hsl(var(--foreground))",
  latest_severity: "#8b5cf6",
} as const;

export const METRIC_CONFIG = [
  { value: "total", label: "Total Traffic" },
  { value: "yellow", label: "Yellow" },
  { value: "red", label: "Red" },
  { value: "dark_red", label: "Dark Red" },
  { value: "latest_severity", label: "Latest Severity" },
  { value: "all", label: "All Metrics" },
] as const;

export type MetricType = typeof METRIC_CONFIG[number]["value"];

export interface TooltipPayload {
  index: number;
  timestamp: Date;
  yellow: number;
  red: number;
  dark_red: number;
  total: number;
  latest_severity: number;
}
