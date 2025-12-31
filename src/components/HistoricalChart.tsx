import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrafficData } from "@/types/traffic";
import { parseISTTimestamp } from "@/utils/timeUtils";
import { calculateTotalTraffic } from "@/utils/trafficUtils";
import { formatDetailedTime, formatRangeTime } from "@/utils/timeFormat";

interface HistoricalChartProps {
  data: TrafficData[];
  isLoading?: boolean;
  selectedDuration?: string;
  onDurationChange?: (duration: string) => void;
}

const CHART_COLORS = {
  yellow: "hsl(var(--traffic-yellow))",
  red: "hsl(var(--traffic-red))",
  dark_red: "hsl(var(--traffic-dark-red))",
  total: "hsl(var(--foreground))",
  latest_severity: "#8b5cf6",
} as const;

const METRIC_CONFIG = [
  { value: "total", label: "Total Traffic" },
  { value: "yellow", label: "Yellow" },
  { value: "red", label: "Red" },
  { value: "dark_red", label: "Dark Red" },
  { value: "latest_severity", label: "Latest Severity" },
  { value: "all", label: "All Metrics" },
] as const;

const DURATION_OPTIONS = {
  "1h": "1h",
  "6h": "6h",
  "12h": "12h",
  "24h": "24h",
  "7d": "7d",
} as const;

type MetricType = typeof METRIC_CONFIG[number]["value"];

interface TooltipPayload {
  index: number;
  timestamp: Date;
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
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const metrics = [
    { label: "Yellow", value: data.yellow },
    { label: "Red", value: data.red },
    { label: "Dark Red", value: data.dark_red },
    { label: "Total", value: data.total, highlight: true },
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
            className={`flex justify-between gap-4 text-xs ${highlight ? "font-medium border-t border-border/50 pt-1" : ""}`}
          >
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-mono">{value}</span>
          </div>
        ))}
        {data.latest_severity && (
          <div className="flex justify-between gap-4 text-xs font-medium">
            <span className="text-muted-foreground">Latest Severity:</span>
            <span className="font-mono">{data.latest_severity.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom label component for data summary
const DataSummaryLabel = ({ data }: { data: TrafficData[] }) => {
  if (!data || data.length === 0) return null;

  return (
    <text
      x="50%"
      y="95%"
      textAnchor="middle"
      className="text-xs fill-muted-foreground"
    >
      {data.length} data points from {formatRangeTime(parseISTTimestamp(data[data.length - 1].ts))} to {formatRangeTime(parseISTTimestamp(data[0].ts))}
    </text>
  );
};

export function HistoricalChart({
  data,
  isLoading,
  selectedDuration,
  onDurationChange,
}: HistoricalChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("total");

  const getMetricColor = (metric: MetricType): string => {
    return CHART_COLORS[metric] || CHART_COLORS.total;
  };

  const getMetricName = (metric: MetricType): string => {
    return METRIC_CONFIG.find(m => m.value === metric)?.label || "Unknown";
  };

  // Generate uniformly spaced time slots for the entire selected duration
  const getSlots = (duration: string | undefined, end: Date): Date[] => {
    const slots: Date[] = [];
    const dur = duration ?? "24h";
    let stepMs = 60 * 60 * 1000; // default 1 hour
    let totalSteps = 24;

    switch (dur) {
      case "1h":
        stepMs = 5 * 60 * 1000; // 5-min steps, 12 points
        totalSteps = 12;
        break;
      case "6h":
        stepMs = 30 * 60 * 1000; // 30-min
        totalSteps = 12;
        break;
      case "12h":
        stepMs = 60 * 60 * 1000; // 1-hour
        totalSteps = 12;
        break;
      case "24h":
        stepMs = 60 * 60 * 1000; // 1-hour
        totalSteps = 24;
        break;
      case "7d":
        stepMs = 24 * 60 * 60 * 1000; // 1-day
        totalSteps = 7;
        break;
      default:
        break;
    }

    for (let i = totalSteps - 1; i >= 0; i--) {
      slots.push(new Date(end.getTime() - i * stepMs));
    }
    return slots;
  };

  // If no data, fallback to current time for slot generation so chart still renders empty grid gracefully
  const endTime = data && data.length > 0 ? parseISTTimestamp(data[data.length - 1].ts) : new Date();
  const slots = getSlots(selectedDuration, endTime);

  // Build chart data directly from API points – keep actual timestamps to avoid losing data
  const sortedData = [...data].sort((a, b) => parseISTTimestamp(a.ts).getTime() - parseISTTimestamp(b.ts).getTime());

  const chartData = sortedData.map((point, idx) => ({
    index: idx,
    timestamp: parseISTTimestamp(point.ts),
    tsMs: parseISTTimestamp(point.ts).getTime(),
    timeString: (() => {
      const d = parseISTTimestamp(point.ts);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      return `${dd}-${mm} ${hh}:${mins}`;
    })(),
    fullTimestamp: point.ts,
    yellow: point.yellow,
    red: point.red,
    dark_red: point.dark_red,
    total: calculateTotalTraffic(point),
    latest_severity: point.yellow + 2 * point.red + 3 * point.dark_red,
  }));

  // Dynamically pick tick interval: aim for ≤ 12 labels
  // Generate uniform tick positions from slots so labels are equally spaced
  const ticks = slots.map((s) => s.getTime());

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
        <div className="flex items-center gap-3">
          {/* Metric Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">Metric:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
              className="
                px-3 py-1 text-sm bg-background border border-border
                rounded-md focus:outline-none focus:ring-2
                focus:ring-primary focus:border-transparent
                cursor-pointer
              "
            >
              {METRIC_CONFIG.map((option) => (
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
                className="
                  px-3 py-1 text-sm bg-background border border-border
                  rounded-md focus:outline-none focus:ring-2
                  focus:ring-primary focus:border-transparent
                  cursor-pointer
                "
              >
                {Object.entries(DURATION_OPTIONS).map(([value, label]) => (
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
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 40,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeWidth={0.8}
              strokeOpacity={0.8}
            />
            <XAxis
              dataKey="tsMs"
              type="number"
              scale="time"
              domain={['auto', 'auto']}
              stroke="currentColor"
              strokeOpacity={0.3}
              tickFormatter={(ts) => {
                const d = new Date(ts as number);
                return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
              }}
              tick={{ fontSize: 10 }}
              tickLine={false}
              interval={Math.max(1, Math.floor(chartData.length / 4))}
            />
            <YAxis
              stroke="currentColor"
              strokeOpacity={0.3}
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                fontSize: "12px",
                paddingBottom: "5px",
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
            <DataSummaryLabel data={data} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
