/**
 * Time Utilities
 *
 * Helper functions for time-related operations in the playback system.
 */

/**
 * Sleep/delay helper
 *
 * Promisified setTimeout for async/await usage.
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format milliseconds to readable duration
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "2:30", "0:45", "12:05")
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate delay between events with condensed timing
 *
 * Strategy:
 * - Delays < 2s: Keep as-is
 * - Delays 2s-10s: Compress to 50%
 * - Delays > 10s: Compress to 2-3s
 *
 * This makes long pauses more watchable during playback.
 *
 * @param rawDelayMs - Raw delay in milliseconds
 * @returns Condensed delay in milliseconds
 */
export function calculateDelay(rawDelayMs: number): number {
  const seconds = rawDelayMs / 1000;

  if (seconds < 2) {
    return rawDelayMs;
  } else if (seconds <= 10) {
    return rawDelayMs * 0.5;
  } else {
    // Logarithmic compression for very long delays
    const compressed = 2000 + Math.min(1000, Math.log10(seconds) * 300);
    return compressed;
  }
}

/**
 * Format timestamp to human-readable time
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted string (e.g., "14:30:45")
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get relative time string
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string (e.g., "2 hours ago", "just now")
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return new Date(timestamp).toLocaleDateString('ko-KR');
  }
}

/**
 * Throttle function execution
 *
 * Limits how often a function can be called.
 *
 * @param func - Function to throttle
 * @param limitMs - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limitMs);
    }
  };
}

/**
 * Debounce function execution
 *
 * Delays function execution until after wait time has elapsed since last call.
 *
 * @param func - Function to debounce
 * @param waitMs - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), waitMs);
  };
}
