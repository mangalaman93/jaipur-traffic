import Activity from "lucide-react/dist/esm/icons/activity";
import { getHoursAgo } from "@/utils/timeUtils";

interface DashboardHeaderProps {
  lastUpdated?: Date | null;
}

export function DashboardHeader({ lastUpdated }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Jaipur Traffic Monitor
              </h1>
              <p className="text-xs text-muted-foreground">
                Real-time grid analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="text-right hidden sm:block">
                <div className="text-xs text-muted-foreground font-mono">
                  Last Updated:{" "}
                  {lastUpdated.toLocaleString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZone: "Asia/Kolkata",
                  })}
                </div>
                <div className="text-xs text-primary font-medium">
                  {getHoursAgo(lastUpdated)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
