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

  // Data processing with hourly averaging - uses timestamp as number for continuous axis
  const processedData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];

    const filteredData = historyData
      .map((item) => {
        const ts = parseISTTimestamp(item.ts);
        return {
          timestamp: ts.getTime(), // Use numeric timestamp for continuous axis
          yellow: item.yellow,
          red: item.red,
          dark_red: item.dark_red,
          total: item.yellow + item.red + item.dark_red,
          severity: item.yellow + item.red * 2 + item.dark_red * 3,
        };
      })
      .filter((item) => {
        const date = new Date(item.timestamp);
        const hour = date.getHours();
        const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
        const hourInRange = hour >= hourRange[0] && hour <= hourRange[1];
        const dayMatches = selectedDays.includes(dayOfWeek);
        return hourInRange && dayMatches;
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    if (isHourlyAveraged) {
      // Group by hour-day combination and calculate averages
      const hourlyGroups = filteredData.reduce((acc, item) => {
        const date = new Date(item.timestamp);
        const hour = date.getHours();
        const dateStr = date.toDateString();
        const hourDayKey = `${dateStr}-${hour}`;

        if (!acc[hourDayKey]) {
          // Create timestamp at the start of the hour for that specific day
          const hourTimestamp = new Date(item.timestamp);
          hourTimestamp.setMinutes(0, 0, 0);

          acc[hourDayKey] = {
            timestamp: hourTimestamp.getTime(),
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
      }, {} as Record<string, { timestamp: number; yellow: number[]; red: number[]; dark_red: number[]; total: number[]; severity: number[] }>);

      return Object.values(hourlyGroups)
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((group) => ({
          timestamp: group.timestamp,
          yellow: group.yellow.reduce((a, b) => a + b, 0) / group.yellow.length,
          red: group.red.reduce((a, b) => a + b, 0) / group.red.length,
          dark_red: group.dark_red.reduce((a, b) => a + b, 0) / group.dark_red.length,
          total: group.total.reduce((a, b) => a + b, 0) / group.total.length,
          severity: group.severity.reduce((a, b) => a + b, 0) / group.severity.length,
        }));
    }

    return filteredData;
  }, [historyData, hourRange, isHourlyAveraged, selectedDays]);

  // Custom x-axis tick formatter - tracks shown dates per render
  const formatXAxisTick = useMemo(() => {
    const shownDates = new Set<string>();
    return (tickItem: number) => {
      const date = new Date(tickItem);
      const hour = date.getHours();
      const minutes = date.getMinutes();
      const dateStr = date.toDateString();

      // Show date on first tick or when day changes
      if (!shownDates.has(dateStr)) {
        shownDates.add(dateStr);
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      }
      
      // Show minutes when not hourly averaged
      if (!isHourlyAveraged) {
        return `${hour}:${minutes.toString().padStart(2, '0')}`;
      }
      return `${hour}:00`;
    };
  }, [processedData, isHourlyAveraged]);

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
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col w-[130px]">
              <label className="text-xs font-medium text-muted-foreground h-4">Time Range</label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="mt-1 h-9 px-2 border border-border rounded-md bg-background text-sm"
              >
                {TIME_RANGE_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col w-[110px]">
              <label className="text-xs font-medium text-muted-foreground h-4">Metric</label>
              <select
                value={selectedMetrics}
                onChange={(e) => setSelectedMetrics(e.target.value)}
                className="mt-1 h-9 px-2 border border-border rounded-md bg-background text-sm"
              >
                {METRIC_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col w-[110px]">
              <label className="text-xs font-medium text-muted-foreground h-4">Day Filter</label>
              <select
                value={selectedDays.length === 7 ? 'all' : selectedDays[0] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedDays(value === 'all' ? [...DAYS_OF_WEEK] : [value]);
                }}
                className="mt-1 h-9 px-2 border border-border rounded-md bg-background text-sm"
              >
                <option value="all">All Days</option>
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground h-4">
                Hours: {hourRange[0]}:00 - {hourRange[1]}:00
              </label>
              <div className="mt-1 h-9 flex items-center">
                <DualHandleSlider
                  min={0}
                  max={23}
                  value={hourRange}
                  onChange={setHourRange}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <label className="text-xs font-medium text-muted-foreground h-4">&nbsp;</label>
              <div className="mt-1 h-9 flex items-center">
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
                <BarChart 
                  data={processedData} 
                  barCategoryGap="1%"
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={[(dataMin: number) => dataMin - 1800000, (dataMax: number) => dataMax + 1800000]}
                    tickFormatter={formatXAxisTick}
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis width={50} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString('en-IN')}
                  />
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
