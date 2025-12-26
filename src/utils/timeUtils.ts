// Helper function to parse IST timestamp from UTC format
export const parseISTTimestamp = (timestamp: string): Date => {
  const date = new Date(timestamp);
  // Adjust for IST offset (UTC+5:30)
  return new Date(date.getTime() - 5.5 * 60 * 60 * 1000);
};

// Helper function to calculate hours ago from a given date
export const getHoursAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    const remainingMinutes = diffInMinutes % 60;
    if (remainingMinutes === 0) {
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    } else {
      return diffInHours === 1
        ? `1 hour ${remainingMinutes} min ago`
        : `${diffInHours} hours ${remainingMinutes} min ago`;
    }
  } else if (diffInDays < 7) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  } else {
    const weeks = Math.floor(diffInDays / 7);
    const remainingDays = diffInDays % 7;
    if (remainingDays === 0) {
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else {
      return weeks === 1
        ? `1 week ${remainingDays} days ago`
        : `${weeks} weeks ${remainingDays} days ago`;
    }
  }
};
