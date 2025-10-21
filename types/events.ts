/**
 * Event Sourcing Type Definitions
 *
 * Core types for the event sourcing system that captures all writing activities.
 * These types ensure type safety across the entire event pipeline:
 * Browser → IndexedDB → API → PostgreSQL
 */

/**
 * Event Types
 *
 * Three fundamental operations that can modify document content:
 * - insert: Add new characters/text at a position
 * - delete: Remove characters/text at a position
 * - replace: Replace existing text (used for paste/autocomplete)
 */
export type EventType = 'insert' | 'delete' | 'replace';

/**
 * Writing Event Structure
 *
 * Immutable record of a single writing action.
 * Each event captures what changed, where, and when.
 */
export interface WritingEvent {
  /** Unique identifier (UUID) */
  id: string;
  /** Document this event belongs to */
  document_id: string;
  /** Writing session identifier (UUID) */
  session_id: string;
  /** High-resolution timestamp (performance.now() or Date.now()) */
  timestamp: number;
  /** Type of modification */
  event_type: EventType;
  /** Character position where change occurred (0-indexed) */
  position: number;
  /** New content added (for insert/replace) */
  content: string | null;
  /** Previous content (for delete/replace, used in diff) */
  content_before: string | null;
}

/**
 * Event for insertion into database (without id)
 */
export interface WritingEventInsert extends Omit<WritingEvent, 'id'> {
  id?: string;
}

/**
 * Event Queue Item
 *
 * Local event in IndexedDB queue waiting to sync to server.
 * Includes sync status tracking.
 */
export interface QueuedEvent extends WritingEvent {
  /** Whether this event has been synced to server */
  synced: boolean;
  /** ISO timestamp when queued locally */
  queued_at: string;
  /** Number of sync retry attempts */
  retry_count?: number;
  /** Last error message if sync failed */
  last_error?: string;
}

/**
 * Batch Event Upload Request
 *
 * Format for sending multiple events to the server in a single request.
 */
export interface EventBatchRequest {
  document_id: string;
  events: WritingEventInsert[];
}

/**
 * Batch Event Upload Response
 */
export interface EventBatchResponse {
  success: boolean;
  inserted_count: number;
  failed_events?: string[];
  error?: string;
}

/**
 * Document Checkpoint
 *
 * Periodic snapshot of full document content for performance optimization.
 * Prevents needing to replay thousands of events from the beginning.
 */
export interface Checkpoint {
  id: string;
  document_id: string;
  /** Number of events this checkpoint includes */
  event_count: number;
  /** Complete document content at this point */
  full_content: string;
  created_at: string;
}

/**
 * Event Replay Result
 *
 * Output from replaying events to reconstruct document state.
 */
export interface ReplayResult {
  /** Final reconstructed content */
  content: string;
  /** Total events processed */
  event_count: number;
  /** Time taken to replay (ms) */
  duration_ms: number;
  /** Whether a checkpoint was used */
  used_checkpoint: boolean;
}

/**
 * Document State
 *
 * Current state of a document being edited.
 */
export interface DocumentState {
  /** Document ID */
  id: string;
  /** Current content */
  content: string;
  /** Current cursor position */
  cursor_position: number;
  /** Is content being saved */
  is_saving: boolean;
  /** Last saved timestamp */
  last_saved_at: string | null;
  /** Pending events count in local queue */
  pending_events: number;
}

/**
 * Event Statistics
 *
 * Analytics data for a document's writing activity.
 */
export interface EventStats {
  total_events: number;
  insert_count: number;
  delete_count: number;
  replace_count: number;
  total_characters_written: number;
  total_characters_deleted: number;
  first_event_at: string | null;
  last_event_at: string | null;
  session_count: number;
}
