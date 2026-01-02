export function parseISTTimestamp(timestamp: string | null): Date {
  if (!timestamp) return new Date();

  try {
    // Handle different timestamp formats
    if (timestamp.includes("T")) {
      // ISO format: 2025-12-31T16:11:30.000Z
      // The API sends IST timestamps with Z suffix, so we need to remove Z and treat as local time
      if (timestamp.endsWith("Z")) {
        // Remove Z suffix and parse as local time (IST)
        const timestampWithoutZ = timestamp.slice(0, -1);
        return new Date(timestampWithoutZ);
      }
      return new Date(timestamp);
    } else {
      // Custom format: 2025-12-31 21:41:30
      return new Date(timestamp.replace(" ", "T"));
    }
  } catch (error) {
    console.warn("Invalid timestamp format:", timestamp);
    return new Date();
  }
}

export function getHoursAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInMinutes === 0) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  if (diffInHours < 24) {
    const remainingMinutes = diffInMinutes % 60;
    if (remainingMinutes === 0) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    return `${diffInHours}h ${remainingMinutes}m ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "1 day ago";
  return `${diffInDays} days ago`;
}
