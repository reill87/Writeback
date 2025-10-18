import type {
  WritingEvent,
  ReplayResult,
  Checkpoint,
  EventStats,
} from '@/types/events';

/**
 * Event Sourcing Engine
 *
 * Core engine for replaying writing events to reconstruct document state.
 * This is the heart of the event sourcing system.
 *
 * Key principles:
 * 1. Events are immutable and ordered by timestamp
 * 2. Current state is derived by replaying events sequentially
 * 3. Checkpoints provide performance optimization for large event histories
 */
export class EventSourcingEngine {
  /**
   * Apply a single event to content
   *
   * @param content - Current content state
   * @param event - Event to apply
   * @returns New content after applying event
   */
  private static applyEvent(content: string, event: WritingEvent): string {
    const { event_type, position, content: newContent, content_before } = event;

    switch (event_type) {
      case 'insert': {
        // Insert new content at position
        if (!newContent) return content;
        const before = content.slice(0, position);
        const after = content.slice(position);
        return before + newContent + after;
      }

      case 'delete': {
        // Delete content_before length characters at position
        if (!content_before) return content;
        const deleteLength = content_before.length;
        const before = content.slice(0, position);
        const after = content.slice(position + deleteLength);
        return before + after;
      }

      case 'replace': {
        // Replace content_before with newContent at position
        if (!content_before || !newContent) return content;
        const replaceLength = content_before.length;
        const before = content.slice(0, position);
        const after = content.slice(position + replaceLength);
        return before + newContent + after;
      }

      default:
        console.warn(`Unknown event type: ${event_type}`);
        return content;
    }
  }

  /**
   * Replay events to reconstruct document content
   *
   * @param events - Sorted array of events (by timestamp ASC)
   * @param checkpoint - Optional checkpoint to start from
   * @returns Replay result with final content and metadata
   */
  static replay(
    events: WritingEvent[],
    checkpoint?: Checkpoint
  ): ReplayResult {
    const startTime = performance.now();

    // Start from checkpoint or empty string
    let content = checkpoint?.full_content ?? '';
    const startEventIndex = checkpoint?.event_count ?? 0;

    // Apply events sequentially
    const eventsToReplay = events.slice(startEventIndex);
    for (const event of eventsToReplay) {
      content = this.applyEvent(content, event);
    }

    const duration_ms = performance.now() - startTime;

    return {
      content,
      event_count: eventsToReplay.length,
      duration_ms,
      used_checkpoint: !!checkpoint,
    };
  }

  /**
   * Replay events up to a specific timestamp (for playback feature)
   *
   * @param events - Sorted array of events (by timestamp ASC)
   * @param targetTimestamp - Target timestamp to replay up to
   * @param checkpoint - Optional checkpoint to start from
   * @returns Content state at the target timestamp
   */
  static replayUpTo(
    events: WritingEvent[],
    targetTimestamp: number,
    checkpoint?: Checkpoint
  ): string {
    let content = checkpoint?.full_content ?? '';
    const startEventIndex = checkpoint?.event_count ?? 0;

    // Filter events up to target timestamp
    const eventsToReplay = events
      .slice(startEventIndex)
      .filter((e) => e.timestamp <= targetTimestamp);

    // Apply events sequentially
    for (const event of eventsToReplay) {
      content = this.applyEvent(content, event);
    }

    return content;
  }

  /**
   * Calculate statistics from event history
   *
   * @param events - Array of events to analyze
   * @returns Event statistics
   */
  static calculateStats(events: WritingEvent[]): EventStats {
    if (events.length === 0) {
      return {
        total_events: 0,
        insert_count: 0,
        delete_count: 0,
        replace_count: 0,
        total_characters_written: 0,
        total_characters_deleted: 0,
        first_event_at: null,
        last_event_at: null,
        session_count: 0,
      };
    }

    let insert_count = 0;
    let delete_count = 0;
    let replace_count = 0;
    let total_characters_written = 0;
    let total_characters_deleted = 0;
    const sessions = new Set<string>();

    for (const event of events) {
      sessions.add(event.session_id);

      switch (event.event_type) {
        case 'insert':
          insert_count++;
          total_characters_written += event.content?.length ?? 0;
          break;
        case 'delete':
          delete_count++;
          total_characters_deleted += event.content_before?.length ?? 0;
          break;
        case 'replace':
          replace_count++;
          total_characters_written += event.content?.length ?? 0;
          total_characters_deleted += event.content_before?.length ?? 0;
          break;
      }
    }

    // Sort by timestamp to find first and last
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];

    return {
      total_events: events.length,
      insert_count,
      delete_count,
      replace_count,
      total_characters_written,
      total_characters_deleted,
      first_event_at: new Date(firstEvent.timestamp).toISOString(),
      last_event_at: new Date(lastEvent.timestamp).toISOString(),
      session_count: sessions.size,
    };
  }

  /**
   * Validate event ordering and integrity
   *
   * @param events - Events to validate
   * @returns Validation result with errors if any
   */
  static validate(events: WritingEvent[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if events are sorted by timestamp
    for (let i = 1; i < events.length; i++) {
      if (events[i].timestamp < events[i - 1].timestamp) {
        errors.push(
          `Events not sorted: event ${i} (ts: ${events[i].timestamp}) comes before event ${i - 1} (ts: ${events[i - 1].timestamp})`
        );
      }
    }

    // Check for required fields
    events.forEach((event, index) => {
      if (!event.id) errors.push(`Event ${index}: missing id`);
      if (!event.document_id) errors.push(`Event ${index}: missing document_id`);
      if (!event.session_id) errors.push(`Event ${index}: missing session_id`);
      if (event.timestamp === undefined)
        errors.push(`Event ${index}: missing timestamp`);
      if (!event.event_type) errors.push(`Event ${index}: missing event_type`);
      if (event.position === undefined || event.position < 0)
        errors.push(`Event ${index}: invalid position`);

      // Type-specific validation
      if (event.event_type === 'insert' && !event.content) {
        errors.push(`Event ${index}: insert event missing content`);
      }
      if (event.event_type === 'delete' && !event.content_before) {
        errors.push(`Event ${index}: delete event missing content_before`);
      }
      if (
        event.event_type === 'replace' &&
        (!event.content || !event.content_before)
      ) {
        errors.push(`Event ${index}: replace event missing content or content_before`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Determine if a checkpoint should be created
   *
   * Strategy: Create checkpoint every 1000 events
   *
   * @param eventCount - Current event count
   * @returns Whether to create a checkpoint
   */
  static shouldCreateCheckpoint(eventCount: number): boolean {
    return eventCount > 0 && eventCount % 1000 === 0;
  }
}
