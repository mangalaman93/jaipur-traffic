// Constants for coordinate calculation
const JAIPUR_NORTH_WEST_LAT = 26.99;
const JAIPUR_NORTH_WEST_LNG = 75.65;
const CELL_HEIGHT_METERS = 1100;
const CELL_WIDTH_METERS = 1800;
const METERS_PER_DEGREE_LAT = 111320; // Approximate meters per degree of latitude

// Helper functions for coordinate calculation
const addMetersInLatitude = (latitude: number, meters: number): number => {
  return latitude - meters / METERS_PER_DEGREE_LAT;
};

const addMetersInLongitude = (latitude: number, longitude: number, meters: number): number => {
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos(latitude * Math.PI / 180);
  return longitude + meters / metersPerDegreeLng;
};

// Calculate center coordinates of a grid cell
export const getCellCenterCoordinates = (col: number, row: number): { lat: number; lng: number } => {
  // Calculate the top-left corner of the cell
  const cellTopLat = addMetersInLatitude(JAIPUR_NORTH_WEST_LAT, row * CELL_HEIGHT_METERS);
  const cellLeftLng = addMetersInLongitude(JAIPUR_NORTH_WEST_LAT, JAIPUR_NORTH_WEST_LNG, col * CELL_WIDTH_METERS);

  // Calculate center by adding half cell dimensions
  const centerLat = addMetersInLatitude(cellTopLat, CELL_HEIGHT_METERS / 2);
  const centerLng = addMetersInLongitude(cellTopLat, cellLeftLng, CELL_WIDTH_METERS / 2);

  return { lat: centerLat, lng: centerLng };
};

// Generate Google Maps URL
export const getGoogleMapsUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps/@${lat},${lng},1200m/data=!3m1!1e3!5m1!1e1`;
};
