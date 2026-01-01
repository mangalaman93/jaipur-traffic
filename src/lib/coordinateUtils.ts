export function getCellCenterCoordinates(x: number, y: number): { lat: number; lng: number } {
  // Jaipur approximate coordinates
  // This is a simplified calculation - in production, you'd use actual GIS data
  const baseLat = 26.9124; // Jaipur center latitude
  const baseLng = 75.7873; // Jaipur center longitude

  // Each grid cell represents approximately 0.01 degrees
  const cellSize = 0.01;

  return {
    lat: baseLat + (y - 10) * cellSize, // Assuming grid is centered around row 10
    lng: baseLng + (x - 7) * cellSize, // Assuming grid is centered around column 7
  };
}

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
