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
import { TrafficData } from "@/lib/types";
import { DURATION_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { formatRangeTime, formatChartTime } from "@/lib/timeFormat";
import { parseISTTimestamp } from "@/lib/timeUtils";
import { ChartTooltip } from "./chart/ChartTooltip";
import { DurationSelector } from "./chart/DurationSelector";
import { processChartData, getChartLines } from "./chart/ChartDataProcessor";
import { MetricType, METRIC_CONFIG } from "./chart/ChartConfig";

interface HistoricalChartProps {
  data: TrafficData[];
  isLoading?: boolean;
  selectedDuration?: string;
  onDurationChange?: (duration: string) => void;
}

export function HistoricalChart({
  data,
  isLoading = false,
  selectedDuration = DURATION_OPTIONS[3],
  onDurationChange,
}: HistoricalChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("total");

  const chartData = processChartData(data);
  const chartLines = getChartLines(selectedMetric);

  const getTimeRange = () => {
    if (!data.length) return "No time range available";

    const sortedData = [...data].sort((a, b) => {
      const dateA = parseISTTimestamp(a.ts);
      const dateB = parseISTTimestamp(b.ts);
      return dateA.getTime() - dateB.getTime();
    });

    const startTime = formatRangeTime(parseISTTimestamp(sortedData[0].ts));
    const endTime = formatRangeTime(parseISTTimestamp(sortedData[sortedData.length - 1].ts));

    return `${startTime} - ${endTime}`;
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "h-96 flex items-center justify-center",
          "bg-muted/20 rounded-lg border border-border/50"
        )}
      >
        <div className="text-sm text-muted-foreground">Loading historical data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "h-96 flex items-center justify-center",
          "bg-muted/20 rounded-lg border border-border/50"
        )}
      >
        <div className="text-sm text-muted-foreground">No historical data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <span className="text-primary">{">"}</span>
          <span>Historical Chart</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value as MetricType)}
            className={cn(
              "px-3 py-1 text-sm bg-background border border-border rounded-md",
              "focus:outline-none focus:ring-2 focus:ring-primary",
              "focus:border-transparent cursor-pointer"
            )}
          >
            {METRIC_CONFIG.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {onDurationChange && (
            <DurationSelector
              selectedDuration={selectedDuration}
              onDurationChange={onDurationChange}
            />
          )}
        </div>
      </div>

      <div className="h-96 bg-muted/20 rounded-lg border border-border/50 p-4">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
            <XAxis
              dataKey="timestamp"
              stroke="currentColor"
              strokeOpacity={0.3}
              tick={{ fontSize: 10 }}
              tickLine={false}
              type="number"
              domain={["dataMin", "dataMax"]}
              scale="time"
              tickFormatter={value => formatChartTime(new Date(value))}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="currentColor"
              strokeOpacity={0.3}
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: "12px", paddingBottom: "5px" }}
            />

            {chartLines.map(line => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke}
                strokeWidth={2}
                dot={false}
                name={line.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="text-xs text-muted-foreground text-center">
          {getTimeRange()} • {data.length} data points
        </div>
      </div>
    </div>
  );
}
