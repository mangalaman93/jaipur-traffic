import { cn } from "@/lib/utils";
import { DURATION_OPTIONS } from "@/constants/traffic";

interface DurationSelectorProps {
  selectedDuration?: string;
  onDurationChange?: (value: string) => void;
}

export function DurationSelector({
  selectedDuration = "24h",
  onDurationChange,
}: DurationSelectorProps) {
  return (
    <select
      value={selectedDuration}
      onChange={(e) => onDurationChange?.(e.target.value)}
      className={cn(
        "px-3 py-1 text-sm bg-background border border-border rounded-md",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        "focus:border-transparent cursor-pointer",
      )}
    >
      {Object.entries(DURATION_OPTIONS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
