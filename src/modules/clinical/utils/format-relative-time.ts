/** Short relative label for runtime status bar (e.g. "just now", "12s ago"). */
export function formatRelativeTime(timestampMs: number, nowMs = Date.now()): string {
  const deltaSec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));
  if (deltaSec < 5) {
    return "just now";
  }
  if (deltaSec < 60) {
    return `${deltaSec}s ago`;
  }
  const minutes = Math.floor(deltaSec / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  return `${Math.floor(minutes / 60)}h ago`;
}
