import { z } from "zod";

// Schema for historical traffic data API responses
export const HistoricalTrafficDataSchema = z.object({
  x: z.number().int().min(0).max(14), // 15 columns (0-14)
  y: z.number().int().min(0).max(20), // 21 rows (0-20)
  yellow: z.number().int().min(0),
  red: z.number().int().min(0),
  dark_red: z.number().int().min(0),
  ts: z.string().nullable(),
  latest_severity: z.number().min(0).optional(),
  p95: z.number().min(0).optional(),
  p99: z.number().min(0).optional(),
  threshold_p95: z.number().min(0).optional(),
});

// Schema for current traffic data API responses
export const CurrentTrafficDataSchema = z.object({
  x: z.number().int().min(0).max(14), // 15 columns (0-14)
  y: z.number().int().min(0).max(20), // 21 rows (0-20)
  yellow: z.number().int().min(0),
  red: z.number().int().min(0),
  dark_red: z.number().int().min(0),
  latest_severity: z.number().min(0),
  p95: z.number().min(0),
  p99: z.number().min(0),
  ts: z.string().nullable(),
  threshold_p95: z.number().min(0).optional(),
});

// Schema for sustained traffic data API responses
export const SustainedTrafficDataSchema = z.object({
  x: z.number().int().min(0).max(14), // 15 columns (0-14)
  y: z.number().int().min(0).max(20), // 21 rows (0-20)
  yellow: z.number().int().min(0),
  red: z.number().int().min(0),
  dark_red: z.number().int().min(0),
  latest_severity: z.number().min(0),
  threshold_p95: z.number().min(0),
  latest_ts: z.string().nullable(),
  p95: z.number().min(0).optional(),
  p99: z.number().min(0).optional(),
  ts: z.string().nullable().optional(),
});

// Array schemas for validation
export const CurrentTrafficDataArraySchema = z.array(CurrentTrafficDataSchema);
export const SustainedTrafficDataArraySchema = z.array(SustainedTrafficDataSchema);
export const HistoricalTrafficDataArraySchema = z.array(HistoricalTrafficDataSchema);

// Type inference from schemas
export type ValidatedCurrentTrafficData = z.infer<typeof CurrentTrafficDataSchema>;
export type ValidatedSustainedTrafficData = z.infer<typeof SustainedTrafficDataSchema>;
export type ValidatedHistoricalTrafficData = z.infer<typeof HistoricalTrafficDataSchema>;
export type ValidatedTrafficData = ValidatedCurrentTrafficData;

/**
 * Validates current traffic data array from API response
 * @throws Error if validation fails
 */
export function validateCurrentTrafficData(data: unknown): ValidatedCurrentTrafficData[] {
  try {
    return CurrentTrafficDataArraySchema.parse(data);
  } catch (error) {
    console.error("Current API response validation failed:", error);
    throw new Error("Invalid current traffic data received from API");
  }
}

/**
 * Validates historical traffic data array from API response
 * @throws Error if validation fails
 */
export function validateHistoricalTrafficData(data: unknown): ValidatedHistoricalTrafficData[] {
  try {
    return HistoricalTrafficDataArraySchema.parse(data);
  } catch (error) {
    console.error("Historical API response validation failed:", error);
    throw new Error("Invalid historical traffic data received from API");
  }
}

/**
 * Validates sustained traffic data array from API response
 * @throws Error if validation fails
 */
export function validateSustainedTrafficData(data: unknown): ValidatedSustainedTrafficData[] {
  try {
    return SustainedTrafficDataArraySchema.parse(data);
  } catch (error) {
    console.error("Sustained API response validation failed:", error);
    throw new Error("Invalid sustained traffic data received from API");
  }
}
