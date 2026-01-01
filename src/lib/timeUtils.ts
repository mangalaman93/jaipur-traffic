export function parseISTTimestamp(timestamp: string | null): Date {
  if (!timestamp) return new Date();

  try {
    // Handle different timestamp formats
    if (timestamp.includes("T")) {
      // ISO format: 2025-12-31T16:11:30.000Z
      return new Date(timestamp);
    } else {
      // Custom format: 2025-12-31 21:41:30
      return new Date(timestamp.replace(" ", "T") + "Z");
    }
  } catch (error) {
    console.warn("Invalid timestamp format:", timestamp);
    return new Date();
  }
}

export function getHoursAgo(date: Date): string {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours === 0) return "Just now";
  if (diffInHours === 1) return "1 hour ago";
  if (diffInHours < 24) return `${diffInHours} hours ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "1 day ago";
  return `${diffInDays} days ago`;
}
