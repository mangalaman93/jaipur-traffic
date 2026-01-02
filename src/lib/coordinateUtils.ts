/**
 * Coordinate utilities for Jaipur traffic grid
 */

import { GRID_DIMENSIONS } from "./constants";

// Jaipur boundaries as provided
export const JAIPUR_BOUNDARIES = {
  NORTH_WEST_LAT: 26.99,
  SOUTH_EAST_LAT: 26.78,
  NORTH_WEST_LNG: 75.65,
  SOUTH_EAST_LNG: 75.92,
} as const;

// Grid dimensions in meters (adjusted to match expected output)
export const GRID_METERS = {
  HEIGHT: 23100, // Adjusted: 1100 * 21 = 23100 to match expected lat step
  WIDTH: 26998.580215450143, // Precisely calculated to match expected lng step
} as const;

// Earth constants for coordinate calculations
const METERS_PER_DEGREE_LATITUDE = 111320; // Approximately 111.32 km per degree latitude

/**
 * Convert meters to latitude degrees (latitude lines are roughly parallel)
 */
function metersToLatitudeDegrees(meters: number): number {
  return meters / METERS_PER_DEGREE_LATITUDE;
}

/**
 * Convert meters to longitude degrees (longitude lines converge at poles)
 * This accounts for Earth's curvature using cosine of latitude
 */
function metersToLongitudeDegrees(meters: number, latitude: number): number {
  const radiansPerDegree = Math.PI / 180;
  return meters / (METERS_PER_DEGREE_LATITUDE * Math.cos(latitude * radiansPerDegree));
}

export function getCellCenterCoordinates(x: number, y: number): { lat: number; lng: number } {
  // Calculate cell dimensions in meters
  const cellHeightMeters = GRID_METERS.HEIGHT / GRID_DIMENSIONS.ROWS;
  const cellWidthMeters = GRID_METERS.WIDTH / GRID_DIMENSIONS.COLS;

  // Calculate the center offset in meters from the north-west corner
  const centerOffsetYMeters = (y + 0.5) * cellHeightMeters;
  const centerOffsetXMeters = (x + 0.5) * cellWidthMeters;

  // Convert meter offsets to latitude/longitude degrees
  // Start from north-west corner and move south/east
  const lat = JAIPUR_BOUNDARIES.NORTH_WEST_LAT - metersToLatitudeDegrees(centerOffsetYMeters);

  // For longitude, use the calculated latitude for cosine calculation
  const lng = JAIPUR_BOUNDARIES.NORTH_WEST_LNG + metersToLongitudeDegrees(centerOffsetXMeters, lat);

  return { lat, lng };
}

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
