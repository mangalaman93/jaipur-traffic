import { TIMEZONE } from "./constants";

export type TimeFormatOptions = {
  includeSeconds?: boolean;
  includeTimeZone?: boolean;
  use12Hour?: boolean;
  compact?: boolean;
};

/**
 * Detailed time format with full information
 * Format: "DD-MMM-YYYY HH:MM:SS IST" (e.g., "31-Dec-2025 21:41:30 IST")
 */
export function formatDetailedTime(date: Date): string {
  const options: TimeFormatOptions = {
    includeSeconds: true,
    includeTimeZone: true,
    use12Hour: false,
    compact: false,
  };

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: options.compact ? "2-digit" : "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: options.use12Hour,
    timeZone: TIMEZONE,
  };

  if (options.includeSeconds) {
    formatOptions.second = "2-digit";
  }

  let formatted = date.toLocaleString("en-IN", formatOptions);

  // Replace slashes with dashes for consistency
  formatted = formatted.replace(/\//g, "-");

  // Add timezone if requested and not already included
  if (options.includeTimeZone && !formatted.includes("IST")) {
    formatted += " IST";
  }

  return formatted;
}

/**
 * Time format for data ranges and summaries
 * Format: "DD-MMM-YYYY HH:MM" (consistent, no timezone)
 */
export function formatRangeTime(date: Date): string {
  const options: TimeFormatOptions = {
    includeSeconds: false,
    includeTimeZone: false,
    use12Hour: false,
    compact: false,
  };

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: options.compact ? "2-digit" : "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: options.use12Hour,
    timeZone: TIMEZONE,
  };

  if (options.includeSeconds) {
    formatOptions.second = "2-digit";
  }

  let formatted = date.toLocaleString("en-IN", formatOptions);

  // Replace slashes with dashes for consistency
  formatted = formatted.replace(/\//g, "-");

  // Add timezone if requested and not already included
  if (options.includeTimeZone && !formatted.includes("IST")) {
    formatted += " IST";
  }

  return formatted;
}

/**
 * Time format for chart x-axis
 * Format: "DD/MM HH:MM" (e.g., "31/12 23:23")
 */
export function formatChartTime(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day}/${month} ${hours}:${minutes}`;
}
