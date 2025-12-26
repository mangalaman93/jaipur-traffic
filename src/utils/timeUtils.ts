// Helper function to parse IST timestamp from UTC format
export const parseISTTimestamp = (timestamp: string): Date => {
  const date = new Date(timestamp);
  // Adjust for IST offset (UTC+5:30)
  return new Date(date.getTime() - 5.5 * 60 * 60 * 1000);
};
