import { z } from "zod";

// Schema for traffic data API responses
export const TrafficDataSchema = z.object({
  x: z.number().int().min(0).max(20),
  y: z.number().int().min(0).max(14),
  yellow: z.number().int().min(0),
  red: z.number().int().min(0),
  dark_red: z.number().int().min(0),
  latest_severity: z.number().min(0),
  p95: z.number().min(0),
  p99: z.number().min(0),
  threshold_p95: z.number().min(0),
  ts: z.string().nullable(),
});

export const TrafficDataArraySchema = z.array(TrafficDataSchema);

// Type inference from schema (ensures sync with TrafficData type)
export type ValidatedTrafficData = z.infer<typeof TrafficDataSchema>;

/**
 * Validates traffic data array from API response
 * @throws Error if validation fails
 */
export function validateTrafficData(data: unknown): ValidatedTrafficData[] {
  try {
    return TrafficDataArraySchema.parse(data);
  } catch (error) {
    console.error("API response validation failed:", error);
    throw new Error("Invalid traffic data received from API");
  }
}
