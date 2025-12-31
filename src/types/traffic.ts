export interface TrafficData {
  x: number;
  y: number;
  yellow: number;
  red: number;
  dark_red: number;
  ts: string;
  latest_severity?: number;
  p95?: number;
  p99?: number;
}
