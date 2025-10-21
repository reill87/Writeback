import type { WritingEvent } from '@/types/events';

/**
 * Replay Frame
 *
 * Single frame in the playback animation.
 */
export interface ReplayFrame {
  /** Current content state at this frame */
  content: string;
  /** Event that triggered this frame */
  event: WritingEvent;
  /** Event index (0-based) */
  eventIndex: number;
  /** Total events */
  totalEvents: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Milliseconds to wait before next frame */
  delayMs: number;
}

/**
 * Replay Generator
 *
 * Async generator that yields replay frames for playback animation.
 *
 * Usage:
 * ```ts
 * for await (const frame of replayEvents(events, speed)) {
 *   updateUI(frame.content);
 *   await delay(frame.delayMs);
 * }
 * ```
 *
 * @param events - Sorted array of events (by timestamp ASC)
 * @param speed - Playback speed multiplier (0.5x, 1x, 2x, 4x)
 * @returns Async generator yielding replay frames
 */
export async function* replayEvents(
  events: WritingEvent[],
  speed: number = 1
): AsyncGenerator<ReplayFrame> {
  if (events.length === 0) {
    return;
  }

  let content = '';
  const totalEvents = events.length;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const nextEvent = events[i + 1];

    // Apply event to content
    content = applyEvent(content, event);

    // Calculate delay until next event
    let delayMs = 0;
    if (nextEvent) {
      const rawDelay = nextEvent.timestamp - event.timestamp;
      // Apply condensed timing strategy and speed multiplier
      delayMs = calculateCondensedDelay(rawDelay) / speed;
    }

    // Yield frame
    yield {
      content,
      event,
      eventIndex: i,
      totalEvents,
      progress: ((i + 1) / totalEvents) * 100,
      delayMs,
    };
  }
}

/**
 * Apply a single event to content
 *
 * @param content - Current content
 * @param event - Event to apply
 * @returns New content after applying event
 */
function applyEvent(content: string, event: WritingEvent): string {
  const { event_type, position, content: newContent, content_before } = event;

  switch (event_type) {
    case 'insert': {
      if (!newContent) return content;
      const before = content.slice(0, position);
      const after = content.slice(position);
      return before + newContent + after;
    }

    case 'delete': {
      if (!content_before) return content;
      const deleteLength = content_before.length;
      const before = content.slice(0, position);
      const after = content.slice(position + deleteLength);
      return before + after;
    }

    case 'replace': {
      if (!content_before || !newContent) return content;
      const replaceLength = content_before.length;
      const before = content.slice(0, position);
      const after = content.slice(position + replaceLength);
      return before + newContent + after;
    }

    default:
      return content;
  }
}

/**
 * Calculate condensed delay for playback
 *
 * Strategy (from research.md):
 * - Delays < 2s: Keep as-is
 * - Delays 2s-10s: Compress to 50%
 * - Delays > 10s: Compress to 2-3s
 *
 * This makes playback more watchable by compressing long pauses.
 *
 * @param rawDelayMs - Raw delay between events in milliseconds
 * @returns Condensed delay in milliseconds
 */
function calculateCondensedDelay(rawDelayMs: number): number {
  const seconds = rawDelayMs / 1000;

  if (seconds < 2) {
    // Short delays: keep as-is
    return rawDelayMs;
  } else if (seconds <= 10) {
    // Medium delays: compress to 50%
    return rawDelayMs * 0.5;
  } else {
    // Long delays: compress to 2-3 seconds
    // Use logarithmic scale for very long delays
    const compressed = 2000 + Math.min(1000, Math.log10(seconds) * 300);
    return compressed;
  }
}

/**
 * Get total playback duration
 *
 * Calculates how long playback will take with condensed timing.
 *
 * @param events - Array of events
 * @param speed - Playback speed multiplier
 * @returns Total duration in milliseconds
 */
export function getTotalDuration(events: WritingEvent[], speed: number = 1): number {
  if (events.length === 0) return 0;

  let totalMs = 0;

  for (let i = 0; i < events.length - 1; i++) {
    const event = events[i];
    const nextEvent = events[i + 1];
    const rawDelay = nextEvent.timestamp - event.timestamp;
    totalMs += calculateCondensedDelay(rawDelay);
  }

  return totalMs / speed;
}

/**
 * Format duration for display
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string like "2:30" or "0:45"
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Find event index at specific timestamp
 *
 * Used for scrubbing/seeking in timeline.
 *
 * @param events - Array of events
 * @param targetTimestamp - Target timestamp
 * @returns Event index (0-based) or -1 if not found
 */
export function findEventAtTimestamp(
  events: WritingEvent[],
  targetTimestamp: number
): number {
  // Binary search for efficiency
  let left = 0;
  let right = events.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midTimestamp = events[mid].timestamp;

    if (midTimestamp === targetTimestamp) {
      return mid;
    } else if (midTimestamp < targetTimestamp) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // Return closest event before target
  return Math.max(0, right);
}
