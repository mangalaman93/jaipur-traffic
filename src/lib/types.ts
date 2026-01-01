export interface TrafficData {
  x: number;
  y: number;
  yellow: number;
  red: number;
  dark_red: number;
  latest_severity: number;
  p95: number;
  p99: number;
  threshold_p95: number;
  ts: string | null;
}
