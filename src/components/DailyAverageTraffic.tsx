import { TrafficData } from "@/lib/types";
import { parseISTTimestamp } from "@/lib/timeUtils";

interface DailyAverageTrafficProps {
  historicalData: TrafficData[];
}

export function DailyAverageTraffic({ historicalData }: DailyAverageTrafficProps) {
  // Group data by day and calculate daily averages
  const dailyAverages = historicalData.reduce(
    (acc, point) => {
      const date = parseISTTimestamp(point.ts).toDateString();
      const severity = point.yellow + 2 * point.red + 3 * point.dark_red;

      if (!acc[date]) {
        acc[date] = { total: 0, count: 0, date };
      }
      acc[date].total += severity;
      acc[date].count += 1;
      return acc;
    },
    {} as Record<string, { total: number; count: number; date: string }>
  );

  // Convert to array and sort by date (oldest to latest)
  const sortedDays = Object.values(dailyAverages)
    .map(day => ({
      date: new Date(day.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      dateObj: new Date(day.date),
      average: Math.round(day.total / day.count),
    }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  return (
    <>
      {/* First row: Dates */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${sortedDays.length}, minmax(0, 1fr))`,
        }}
      >
        {sortedDays.map((day, index) => (
          <div key={`date-${index}`} className="text-center">
            <span className="text-xs font-medium text-muted-foreground">{day.date}</span>
          </div>
        ))}
      </div>
      {/* Second row: Values */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${sortedDays.length}, minmax(0, 1fr))`,
        }}
      >
        {sortedDays.map((day, index) => (
          <div
            key={`value-${index}`}
            className="text-center p-2 rounded bg-muted/20 border border-border/50"
          >
            <span className="text-sm font-bold text-foreground">{day.average}</span>
          </div>
        ))}
      </div>
    </>
  );
}
