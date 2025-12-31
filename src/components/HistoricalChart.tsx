import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
  Legend,
} from "recharts";
import { TrafficData } from "@/types/traffic";
import { parseISTTimestamp } from "@/utils/timeUtils";
import { calculateTotalTraffic } from "@/utils/trafficUtils";

interface HistoricalChartProps {
  data: TrafficData[];
  isLoading?: boolean;
  selectedDuration?: string;
  onDurationChange?: (duration: string) => void;
}

type MetricType =
  | "total"
  | "yellow"
  | "red"
  | "dark_red"
  | "latest_severity"
  | "all";

interface TooltipPayload {
  index: number;
  timestamp: Date;
  timeString: string;
  fullTimestamp: string;
  yellow: number;
  red: number;
  dark_red: number;
  total: number;
  latest_severity: number;
}

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TooltipPayload }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <div className="text-xs font-medium text-foreground mb-2">
          {data.timestamp.toLocaleString()}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4 text-xs">
            <span className="text-muted-foreground">Yellow:</span>
            <span className="font-mono">{data.yellow}</span>
          </div>
          <div className="flex justify-between gap-4 text-xs">
            <span className="text-muted-foreground">Red:</span>
            <span className="font-mono">{data.red}</span>
          </div>
          <div className="flex justify-between gap-4 text-xs">
            <span className="text-muted-foreground">Dark Red:</span>
            <span className="font-mono">{data.dark_red}</span>
          </div>
          <div className="flex justify-between gap-4 text-xs font-medium border-t border-border/50 pt-1">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-mono">{data.total}</span>
          </div>
          {data.latest_severity && (
            <div className="flex justify-between gap-4 text-xs font-medium">
              <span className="text-muted-foreground">Latest Severity:</span>
              <span className="font-mono">
                {data.latest_severity.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function HistoricalChart({
  data,
  isLoading,
  selectedDuration,
  onDurationChange,
}: HistoricalChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("total");

  const metricOptions = [
    { value: "total", label: "Total Traffic" },
    { value: "yellow", label: "Yellow" },
    { value: "red", label: "Red" },
    { value: "dark_red", label: "Dark Red" },
    { value: "latest_severity", label: "Latest Severity" },
    { value: "all", label: "All Metrics" },
  ] as const;

  const durationOptions = {
    "1h": "1h",
    "6h": "6h",
    "12h": "12h",
    "24h": "24h",
    "7d": "7d",
  } as const;

  const getMetricColor = (metric: MetricType): string => {
    switch (metric) {
      case "total":
        return "hsl(var(--foreground))";
      case "yellow":
        return "hsl(var(--traffic-yellow))";
      case "red":
        return "hsl(var(--traffic-red))";
      case "dark_red":
        return "hsl(var(--traffic-dark-red))";
      case "latest_severity":
        return "#8b5cf6"; // Direct purple color
      default:
        return "hsl(var(--primary))";
    }
  };

  const getMetricName = (metric: MetricType): string => {
    switch (metric) {
      case "total":
        return "Total Traffic";
      case "yellow":
        return "Yellow";
      case "red":
        return "Red";
      case "dark_red":
        return "Dark Red";
      case "latest_severity":
        return "Latest Severity";
      default:
        return "Unknown";
    }
  };

  // Prepare data for Recharts with equal spacing
  const chartData = data.map((point, index) => ({
    index,
    timestamp: parseISTTimestamp(point.ts),
    timeString: parseISTTimestamp(point.ts)
      .toLocaleString([], {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(",", ""),
    fullTimestamp: point.ts,
    yellow: point.yellow,
    red: point.red,
    dark_red: point.dark_red,
    total: calculateTotalTraffic(point),
    latest_severity: point.yellow + 2 * point.red + 3 * point.dark_red,
  }));

  // Calculate equal spacing for X-axis labels
  const totalPoints = chartData.length;
  const labelInterval = Math.max(1, Math.floor(totalPoints / 10)); // Show ~10 labels max

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg border border-border/50">
        <div className="text-sm text-muted-foreground">
          Loading historical data...
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg border border-border/50">
        <div className="text-sm text-muted-foreground">
          No historical data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          Historical Traffic Data
        </h4>
        <div className="flex items-center gap-3">
          {/* Metric Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">Metric:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
              className="px-3 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
            >
              {metricOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Selector */}
          {onDurationChange && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">
                Duration:
              </span>
              <select
                value={selectedDuration}
                onChange={(e) => onDurationChange(e.target.value)}
                className="px-3 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
              >
                {Object.entries(durationOptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-80 bg-muted/20 rounded-lg border border-border/50 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeWidth={0.8}
              strokeOpacity={0.8}
            />
            <XAxis
              dataKey="timeString"
              stroke="currentColor"
              strokeOpacity={0.3}
              tick={{ fontSize: 10 }}
              tickLine={false}
              interval={labelInterval}
            />
            <YAxis
              stroke="currentColor"
              strokeOpacity={0.3}
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                paddingTop: "10px",
              }}
            />

            {selectedMetric === "all" ? (
              <>
                {/* Yellow Line */}
                <Line
                  type="monotone"
                  dataKey="yellow"
                  stroke="hsl(var(--traffic-yellow))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "hsl(var(--traffic-yellow))",
                    stroke: "white",
                    strokeWidth: 2,
                  }}
                  name="Yellow"
                />

                {/* Red Line */}
                <Line
                  type="monotone"
                  dataKey="red"
                  stroke="hsl(var(--traffic-red))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "hsl(var(--traffic-red))",
                    stroke: "white",
                    strokeWidth: 2,
                  }}
                  name="Red"
                />

                {/* Dark Red Line */}
                <Line
                  type="monotone"
                  dataKey="dark_red"
                  stroke="hsl(var(--traffic-dark-red))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "hsl(var(--traffic-dark-red))",
                    stroke: "white",
                    strokeWidth: 2,
                  }}
                  name="Dark Red"
                />

                {/* Total Line */}
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "hsl(var(--foreground))",
                    stroke: "white",
                    strokeWidth: 2,
                  }}
                  name="Total Traffic"
                />

                {/* Severity Line */}
                <Line
                  type="monotone"
                  dataKey="latest_severity"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#8b5cf6",
                    stroke: "white",
                    strokeWidth: 2,
                  }}
                  name="Latest Severity"
                />
              </>
            ) : (
              /* Single selected line */
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={getMetricColor(selectedMetric)}
                strokeWidth={selectedMetric === "total" ? 3 : 2}
                dot={false}
                activeDot={{
                  r: selectedMetric === "total" ? 5 : 4,
                  fill: getMetricColor(selectedMetric),
                  stroke: "white",
                  strokeWidth: 2,
                }}
                name={getMetricName(selectedMetric)}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        <div className="text-xs text-muted-foreground text-center">
          {data.length} data points from{" "}
          {parseISTTimestamp(data[0].ts).toLocaleString()} to{" "}
          {parseISTTimestamp(data[data.length - 1].ts).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
