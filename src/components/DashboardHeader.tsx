import { Activity } from "lucide-react";

interface DashboardHeaderProps {
  lastUpdated?: Date | null;
}

export function DashboardHeader({ lastUpdated }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Jaipur Traffic Monitor</h1>
              <p className="text-xs text-muted-foreground">Real-time grid analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground font-mono hidden sm:block">
                Last Updated: {lastUpdated.toLocaleString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  timeZone: 'Asia/Kolkata'
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
