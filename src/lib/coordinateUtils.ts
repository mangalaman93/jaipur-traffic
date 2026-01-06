/**
 * Coordinate utilities for Jaipur traffic grid
 * @deprecated Use gridBoundaries.ts instead for accurate KML-based coordinates
 */

import { getCellCenter as getCellCenterFromBounds } from "./gridBoundaries";

/**
 * @deprecated Use getCellCenter from gridBoundaries.ts instead
 */
export function getCellCenterCoordinates(x: number, y: number): { lat: number; lng: number } {
  return getCellCenterFromBounds(x, y);
}

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
