interface HourlyGroup {
  timestamp: Date;
  yellow: number[];
  red: number[];
  dark_red: number[];
  total: number[];
  severity: number[];
}

interface ProcessedDataPoint {
  timestamp: Date;
  yellow: number;
  red: number;
  dark_red: number;
  total: number;
  severity: number;
}

// 1. Constants and Interfaces
const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const TIME_RANGE_OPTIONS = [
  { key: "1h", label: "Last 1 Hour", hours: 1 },
  { key: "6h", label: "Last 6 Hours", hours: 6 },
  { key: "12h", label: "Last 12 Hours", hours: 12 },
  { key: "24h", label: "Last 24 Hours", hours: 24 },
  { key: "3d", label: "Last 3 Days", hours: 72 },
  { key: "7d", label: "Last 7 Days", hours: 168 },
  { key: "14d", label: "Last 14 Days", hours: 336 },
  { key: "30d", label: "Last 30 Days", hours: 720 },
] as const;

interface HistoryData {
  x: number;
  y: number;
  yellow: number;
  red: number;
  dark_red: number;
  latest_severity: number;
  ts: string;
}

interface HistoryResponse {
  data: HistoryData[];
}

const METRIC_OPTIONS = [
  { key: "yellow", label: "Yellow", color: "#eab308" },
  { key: "red", label: "Red", color: "#dc2626" },
  { key: "dark_red", label: "Dark Red", color: "#7f1d1d" },
  { key: "total", label: "Total Traffic", color: "#2563eb" },
  { key: "severity", label: "Severity", color: "#7c3aed" },
];

// 2. Helper Functions
import { parseISTTimestamp } from "@/lib/timeUtils";

// Custom Multi-Select Dropdown Component
function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
}: {
  label: string;
  options: { key: string; label: string; color?: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map((option) => option.key));
    setIsOpen(false);
  };

  const handleClearAll = () => {
    onChange([]);
    setIsOpen(false);
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== value));
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div
        className="w-full min-h-10 p-2 border border-border rounded-md bg-background text-foreground cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {selectedValues.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedValues.map((value) => {
              const option = options.find((opt) => opt.key === value);
              return (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {option?.color && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option?.label || value}
                  <button
                    onClick={(e) => handleRemove(value, e)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {/* Select All / Clear All buttons */}
          <div className="flex border-b border-border">
            <button
              onClick={() => handleSelectAll()}
              className="flex-1 p-2 text-sm hover:bg-muted border-r border-border"
            >
              Select All
            </button>
            <button
              onClick={() => handleClearAll()}
              className="flex-1 p-2 text-sm hover:bg-muted"
            >
              Clear All
            </button>
          </div>

          {/* Options list */}
          {options.map((option) => (
            <div
              key={option.key}
              className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
              onClick={() => handleToggle(option.key)}
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.key)}
                readOnly
                className="rounded border-border"
              />
              {option.color && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
              )}
              <span className="text-sm">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Dual Handle Range Slider Component
function DualHandleSlider({
  min,
  max,
  value,
  onChange,
  className = "",
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}) {
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null);

  const handleMouseDown = (handle: "start" | "end") => {
    setIsDragging(handle);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = Math.round(min + percentage * (max - min));

    if (isDragging === "start") {
      onChange([Math.min(newValue, value[1]), value[1]]);
    } else {
      onChange([value[0], Math.max(newValue, value[0])]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const startPercent = ((value[0] - min) / (max - min)) * 100;
  const endPercent = ((value[1] - min) / (max - min)) * 100;

  return (
    <div className={`relative ${className}`}>
      <div
        className="h-2 bg-muted rounded-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Track */}
        <div
          className="absolute h-2 bg-primary rounded-full"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
          }}
        />

        {/* Start Handle */}
        <div
          className="absolute w-4 h-4 bg-primary border-2 border-background rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
          style={{ left: `${startPercent}%`, top: "50%" }}
          onMouseDown={() => handleMouseDown("start")}
        />

        {/* End Handle */}
        <div
          className="absolute w-4 h-4 bg-primary border-2 border-background rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
          style={{ left: `${endPercent}%`, top: "50%" }}
          onMouseDown={() => handleMouseDown("end")}
        />
      </div>
    </div>
  );
}

// 3. Main Component
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, ChevronDown, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  API_ENDPOINTS
} from "@/lib/constants";

export default function History() {
  // State hooks grouped logically
  const [searchParams] = useSearchParams();
  const gridX = parseInt(searchParams.get("x") || "0");
  const gridY = parseInt(searchParams.get("y") || "0");

  const [selectedMetrics, setSelectedMetrics] = useState<string>("total");
  const [selectedDays, setSelectedDays] = useState<string[]>([...DAYS_OF_WEEK]);
  const [hourRange, setHourRange] = useState<[number, number]>([0, 23]);
  const [isHourlyAveraged, setIsHourlyAveraged] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("3d");

  // Data fetching
  const { data: historyData, isLoading } = useQuery<HistoryData[]>({
    queryKey: ["history", gridX, gridY, selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(
        `${API_ENDPOINTS.HISTORY}?x=${gridX}&y=${gridY}&duration=${selectedTimeRange}`,
      );
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data || [];
    },
  });

  // Data processing with hourly averaging
  const processedData = useMemo(() => {
    if (!historyData) return [];

    const filteredData = historyData
      .map((item) => ({
        timestamp: parseISTTimestamp(item.ts),
        yellow: item.yellow,
        red: item.red,
        dark_red: item.dark_red,
        total: item.yellow + item.red + item.dark_red,
        severity: item.yellow + item.red * 2 + item.dark_red * 3,
      }))
      .filter((item) => {
        const hour = item.timestamp.getHours();
        const dayOfWeek = DAYS_OF_WEEK[item.timestamp.getDay()];
        const hourInRange = hour >= hourRange[0] && hour <= hourRange[1];
        const dayMatches = selectedDays.includes(dayOfWeek);
        return hourInRange && dayMatches;
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (isHourlyAveraged) {
      // Group by hour-day combination and calculate averages
      const hourlyGroups = filteredData.reduce((acc, item) => {
        const hour = item.timestamp.getHours(); // IST hour (0-23)
        const date = item.timestamp.toDateString(); // Date string for unique day
        const hourDayKey = `${date}-${hour}`; // Unique key for hour-day combination

        if (!acc[hourDayKey]) {
          // Create timestamp at the start of the hour for that specific day
          const hourTimestamp = new Date(item.timestamp);
          hourTimestamp.setMinutes(0, 0, 0);

          acc[hourDayKey] = {
            timestamp: hourTimestamp,
            yellow: [] as number[],
            red: [] as number[],
            dark_red: [] as number[],
            total: [] as number[],
            severity: [] as number[],
          };
        }
        acc[hourDayKey].yellow.push(item.yellow);
        acc[hourDayKey].red.push(item.red);
        acc[hourDayKey].dark_red.push(item.dark_red);
        acc[hourDayKey].total.push(item.total);
        acc[hourDayKey].severity.push(item.severity);
        return acc;
      }, {} as Record<string, HourlyGroup>);

      // Debug hourly groups
      console.log('Hourly groups created:', Object.keys(hourlyGroups).length);
      console.log('Hourly group keys:', Object.keys(hourlyGroups).slice(0, 10));

      // Sort by timestamp to maintain chronological order
      return Object.values(hourlyGroups)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map((group): ProcessedDataPoint => ({
          timestamp: group.timestamp,
          yellow: group.yellow.length > 0 ? group.yellow.reduce((a: number, b: number) => a + b, 0) / group.yellow.length : 0,
          red: group.red.length > 0 ? group.red.reduce((a: number, b: number) => a + b, 0) / group.red.length : 0,
          dark_red: group.dark_red.length > 0 ? group.dark_red.reduce((a: number, b: number) => a + b, 0) / group.dark_red.length : 0,
          total: group.total.length > 0 ? group.total.reduce((a: number, b: number) => a + b, 0) / group.total.length : 0,
          severity: group.severity.length > 0 ? group.severity.reduce((a: number, b: number) => a + b, 0) / group.severity.length : 0,
        }));
    }

    return filteredData; // Already sorted above
  }, [historyData, hourRange, isHourlyAveraged, selectedDays]);

  // Track which dates we've already shown
  const shownDates = useMemo(() => new Set<string>(), [processedData]);

  // Custom x-axis tick formatter
  const formatXAxisTick = (tickItem: Date | number) => {
    const date = typeof tickItem === 'number' ? new Date(tickItem) : tickItem;
    const hour = date.getHours();
    const dateStr = date.toDateString();

    // Show date on first hour of each day or first tick
    if (hour === 0 || !shownDates.has(dateStr)) {
      shownDates.add(dateStr);
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }
    return `${hour}:00`;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Grid
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Traffic History for Grid ({gridX},{gridY})</h1>
              <p className="text-sm text-muted-foreground">
                {selectedTimeRange} • {selectedMetrics} •
                {selectedDays.length === 7 ? 'All Days' : selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')} •
                Hours {hourRange[0]}-{hourRange[1]}
              </p>
            </div>
          </div>
        </div>

        {/* Controls Section - Single Row */}
        <div className="flex flex-wrap items-end gap-4 bg-card border border-border rounded-lg p-4">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Time Range</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background text-sm"
            >
              {TIME_RANGE_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Metric</label>
            <select
              value={selectedMetrics}
              onChange={(e) => setSelectedMetrics(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background text-sm"
            >
              {METRIC_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Day Filter</label>
            <select
              value={selectedDays.length === 7 ? 'all' : selectedDays[0] || ''}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedDays(value === 'all' ? [...DAYS_OF_WEEK] : [value]);
              }}
              className="w-full p-2 border border-border rounded-md bg-background text-sm"
            >
              <option value="all">All Days</option>
              {DAYS_OF_WEEK.map((day) => (
                <option key={day} value={day}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-[2] min-w-[150px]">
            <label className="block text-xs font-medium mb-1 text-muted-foreground">
              Hours: {hourRange[0]}:00 - {hourRange[1]}:00
            </label>
            <DualHandleSlider
              min={0}
              max={23}
              value={hourRange}
              onChange={setHourRange}
              className="w-full mt-2"
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isHourlyAveraged}
                onChange={(e) => setIsHourlyAveraged(e.target.checked)}
                className="rounded border-border w-4 h-4"
              />
              <span className="text-sm font-medium whitespace-nowrap">Hourly Avg</span>
            </label>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="h-[500px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                <p className="text-muted-foreground">Loading historical data...</p>
              </div>
            ) : processedData && processedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatXAxisTick}
                    interval="preserveStartEnd"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedMetrics === "yellow" && <Bar dataKey="yellow" fill="#eab308" name="Yellow Traffic" />}
                  {selectedMetrics === "red" && <Bar dataKey="red" fill="#dc2626" name="Red Traffic" />}
                  {selectedMetrics === "dark_red" && <Bar dataKey="dark_red" fill="#7f1d1d" name="Dark Red Traffic" />}
                  {selectedMetrics === "total" && <Bar dataKey="total" fill="#2563eb" name="Total Traffic" />}
                  {selectedMetrics === "severity" && <Bar dataKey="severity" fill="#7c3aed" name="Severity" />}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No data available for the selected filters</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
