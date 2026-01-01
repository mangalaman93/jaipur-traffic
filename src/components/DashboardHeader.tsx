import Activity from "lucide-react/dist/esm/icons/activity";
import { cn } from "@/lib/cn";
import { formatDetailedTime } from "@/lib/timeFormat";
import { getHoursAgo } from "@/lib/timeUtils";
import { GOOGLE_MAPS_URL } from "@/lib/constants";

const MapIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

interface DashboardHeaderProps {
  lastUpdated?: Date | null;
}

export function DashboardHeader({ lastUpdated }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container py-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground">Jaipur Traffic Monitor</h1>
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 text-xs",
                    "bg-primary/10 text-primary rounded-md",
                    "hover:bg-primary/20 transition-colors"
                  )}
                >
                  <MapIcon />
                  Grid Mapping
                </a>
              </div>
              <p className="text-xs text-muted-foreground">Real-time grid analysis</p>
            </div>
          </div>

          {lastUpdated && (
            <div className="text-left sm:text-right">
              <div className="text-xs text-muted-foreground font-mono">
                Last Updated: {formatDetailedTime(lastUpdated)}
              </div>
              <div className="text-xs text-primary font-medium">{getHoursAgo(lastUpdated)}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
