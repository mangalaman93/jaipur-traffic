/**
 * Grid boundaries extracted from KML file for Jaipur Traffic Grid (24×16)
 * These are the authoritative coordinates for the grid overlay
 */

export const GRID_BOUNDS = {
  // Grid dimensions from KML
  ROWS: 24,
  COLS: 16,
  
  // Overall bounding box extracted from KML
  // NW corner of x0-y0: 75.65, 26.99
  // SE corner of x15-y23: 75.94032, 26.752846
  NORTH: 26.99,
  SOUTH: 26.752846,
  WEST: 75.65,
  EAST: 75.94032,
  
  // Cell dimensions in degrees (calculated from KML)
  // Width per cell: (75.94032 - 75.65) / 16 = 0.018145
  // Height per cell: (26.99 - 26.752846) / 24 = 0.009881
  CELL_WIDTH: 0.018145,
  CELL_HEIGHT: 0.009881,
} as const;

/**
 * Get the bounds for a specific cell (x, y)
 * @param x Column index (0-15)
 * @param y Row index (0-23)
 * @returns LatLng bounds for the cell
 */
export function getCellBounds(x: number, y: number): {
  north: number;
  south: number;
  west: number;
  east: number;
} {
  const west = GRID_BOUNDS.WEST + x * GRID_BOUNDS.CELL_WIDTH;
  const east = west + GRID_BOUNDS.CELL_WIDTH;
  const north = GRID_BOUNDS.NORTH - y * GRID_BOUNDS.CELL_HEIGHT;
  const south = north - GRID_BOUNDS.CELL_HEIGHT;
  
  return { north, south, west, east };
}

/**
 * Get the center coordinates for a specific cell
 * @param x Column index (0-15)
 * @param y Row index (0-23)
 * @returns Center lat/lng for the cell
 */
export function getCellCenter(x: number, y: number): { lat: number; lng: number } {
  const bounds = getCellBounds(x, y);
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.west + bounds.east) / 2,
  };
}

/**
 * Get the center of the entire grid
 */
export function getGridCenter(): { lat: number; lng: number } {
  return {
    lat: (GRID_BOUNDS.NORTH + GRID_BOUNDS.SOUTH) / 2,
    lng: (GRID_BOUNDS.WEST + GRID_BOUNDS.EAST) / 2,
  };
}

/**
 * Generate a Google Maps URL for given coordinates
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
