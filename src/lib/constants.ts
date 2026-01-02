export const TRAFFIC_SEVERITY_COLORS = {
  critical: "bg-traffic-dark-red/20 border-traffic-dark-red/50 text-traffic-dark-red",
  high: "bg-traffic-red/20 border-traffic-red/50 text-traffic-red",
  medium: "bg-traffic-yellow/20 border-traffic-yellow/50 text-traffic-yellow",
} as const;

export const SEVERITY_LEVEL_COLORS = {
  high: "bg-red-600/20 border-red-600/50 text-red-600",
  moderate: "bg-yellow-600/20 border-yellow-600/50 text-yellow-600",
  normal: "bg-muted/20 border-border/50 text-muted-foreground",
} as const;

export const DURATION_OPTIONS = ["1h", "6h", "12h", "24h", "3d", "7d", "14d"] as const;

export const GRID_DIMENSIONS = {
  ROWS: 21,
  COLS: 15,
  ROW_HEIGHT: 53.3,
  ASPECT_RATIO: 12750 / 10920,
} as const;

const API_BASE = "https://traffic-worker.mangalaman93.workers.dev";

/**
 * Validates and sanitizes URL parameters for the history API endpoint
 * @throws Error if parameters are invalid
 */
const buildHistoryUrl = (x: number, y: number, duration: string): string => {
  // Validate x coordinate (must be integer between 0 and 14)
  if (!Number.isInteger(x) || x < 0 || x > 14) {
    throw new Error(`Invalid x coordinate: ${x}. Must be an integer between 0 and 14.`);
  }

  // Validate y coordinate (must be integer between 0 and 20)
  if (!Number.isInteger(y) || y < 0 || y > 20) {
    throw new Error(`Invalid y coordinate: ${y}. Must be an integer between 0 and 20.`);
  }

  // Validate duration against whitelist
  if (!DURATION_OPTIONS.includes(duration as typeof DURATION_OPTIONS[number])) {
    throw new Error(`Invalid duration: ${duration}. Must be one of: ${DURATION_OPTIONS.join(', ')}`);
  }

  // Use encodeURIComponent for all user-controlled values
  return `${API_BASE}/history?x=${encodeURIComponent(x)}&y=${encodeURIComponent(y)}&duration=${encodeURIComponent(duration)}`;
};

export const API_ENDPOINTS = {
  CURRENT: `${API_BASE}/current`,
  SUSTAINED: `${API_BASE}/sustained`,
  HISTORY: buildHistoryUrl,
} as const;

export const GOOGLE_MAPS_URL = "https://www.google.com/maps/d/edit?mid=1AW5K34KiZmKo32vtBsmOnzNSU45oQS4";

export const TIMEZONE = "Asia/Kolkata" as const;
