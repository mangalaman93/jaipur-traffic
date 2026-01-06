import { cn } from "@/lib/cn";
import { DURATION_OPTIONS } from "@/lib/constants";

interface DurationSelectorProps {
  selectedDuration?: string;
  onDurationChange?: (value: string) => void;
}

export function DurationSelector({
  selectedDuration = DURATION_OPTIONS[3],
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
      {DURATION_OPTIONS.map((duration) => (
        <option key={duration} value={duration}>
          {duration}
        </option>
      ))}
    </select>
  );
}
