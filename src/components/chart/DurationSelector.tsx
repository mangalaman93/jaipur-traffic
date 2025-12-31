import { DURATION_OPTIONS } from "@/constants/traffic";

interface DurationSelectorProps {
  selectedDuration?: string;
  onDurationChange?: (value: string) => void;
}

export function DurationSelector({ selectedDuration = "24h", onDurationChange }: DurationSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.entries(DURATION_OPTIONS).map(([value, label]) => (
        <button
          key={value}
          onClick={() => onDurationChange?.(value)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            selectedDuration === value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
