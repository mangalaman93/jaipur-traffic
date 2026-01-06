import Activity from "lucide-react/dist/esm/icons/activity";
import { BarChart3 } from "lucide-react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDetailedTime } from "@/lib/timeFormat";
import { getHoursAgo } from "@/lib/timeUtils";
import { GOOGLE_MAPS_URL } from "@/lib/constants";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function DashboardHeader({
  lastUpdated,
  activeTab,
  onTabChange,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container py-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          {/* Left side: Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground">
                  Jaipur Traffic Monitor
                </h1>
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-1 text-xs sm:px-2",
                    "bg-primary/10 text-primary rounded-md",
                    "hover:bg-primary/20 transition-colors"
                  )}
                >
                  <MapIcon />
                  <span className="hidden sm:inline">Grid Mapping</span>
                  <span className="sm:hidden">Grid</span>
                </a>
              </div>
              <p className="text-xs text-muted-foreground">Real-time grid analysis</p>
            </div>
          </div>

          {/* Middle: Tabs */}
          {activeTab && onTabChange && (
            <div className="flex justify-center sm:hidden">
              <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 h-auto p-1">
                  <TabsTrigger
                    value="traffic"
                    className={cn(
                      "gap-1 flex items-center",
                      "px-2 py-1.5",
                      "text-xs font-medium"
                    )}
                  >
                    <Activity className="w-3.5 h-3.5 flex-shrink-0" />
                    Traffic
                  </TabsTrigger>
                  <TabsTrigger
                    value="severity"
                    className={cn(
                      "gap-1 flex items-center",
                      "px-2 py-1.5",
                      "text-xs font-medium"
                    )}
                  >
                    <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
                    Severity
                  </TabsTrigger>
                  <TabsTrigger
                    value="sustained"
                    className={cn(
                      "gap-1 flex items-center",
                      "px-2 py-1.5",
                      "text-xs font-medium"
                    )}
                  >
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    Sustained
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Desktop tabs (hidden on mobile) */}
          {activeTab && onTabChange && (
            <div className="hidden sm:flex justify-center">
              <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 h-auto p-1">
                  <TabsTrigger
                    value="traffic"
                    className={cn(
                      "gap-1 flex items-center",
                      "px-2 py-1.5",
                      "text-xs font-medium"
                    )}
                  >
                    <Activity className="w-3.5 h-3.5 flex-shrink-0" />
                    Traffic
                  </TabsTrigger>
                  <TabsTrigger
                    value="severity"
                    className={cn(
                      "gap-1 flex items-center",
                      "px-2 py-1.5",
                      "text-xs font-medium"
                    )}
                  >
                    <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
                    Severity
                  </TabsTrigger>
                  <TabsTrigger
                    value="sustained"
                    className={cn(
                      "gap-1 flex items-center",
                      "px-2 py-1.5",
                      "text-xs font-medium"
                    )}
                  >
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    Sustained
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Right side: Last updated */}
          {lastUpdated && (
            <div className="text-left sm:text-right">
              <div className="text-xs text-muted-foreground font-mono">
                Last Updated: {formatDetailedTime(lastUpdated)}
              </div>
              <div className="text-xs text-primary font-medium">
                {getHoursAgo(lastUpdated)}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
