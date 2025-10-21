import Dexie, { type Table } from 'dexie';
import type { QueuedEvent } from '@/types/events';

/**
 * Local Document Cache
 *
 * Cached document metadata from server for offline access.
 */
export interface CachedDocument {
  id: string;
  user_id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'private' | 'public' | 'unlisted';
  created_at: string;
  updated_at: string;
  last_edited_at: string;
  /** Last known content (from latest checkpoint or replay) */
  cached_content: string | null;
  /** Last sync timestamp */
  last_synced_at: string | null;
}

/**
 * Sync Status Tracking
 *
 * Tracks synchronization state per document.
 */
export interface SyncStatus {
  document_id: string;
  /** Number of events waiting to sync */
  pending_count: number;
  /** Is currently syncing */
  is_syncing: boolean;
  /** Last successful sync */
  last_sync_at: string | null;
  /** Last sync error */
  last_error: string | null;
  /** Retry count for current batch */
  retry_count: number;
}

/**
 * Writing Timeline Platform - Local Database
 *
 * IndexedDB schema for offline-first event storage.
 *
 * Tables:
 * - events: Queue of writing events waiting to sync to server
 * - documents: Cached document metadata for offline access
 * - syncStatus: Synchronization state tracking
 */
export class WritingTimelineDB extends Dexie {
  // Table declarations with proper typing
  events!: Table<QueuedEvent, 'id'>;
  documents!: Table<CachedDocument, 'id'>;
  syncStatus!: Table<SyncStatus, 'document_id'>;

  constructor() {
    super('WritingTimelineDB');

    // Schema version 1
    this.version(1).stores({
      // Events table
      // Indexes: document_id, synced status, timestamp, session_id
      events:
        'id, document_id, [document_id+synced], [document_id+timestamp], session_id, synced, queued_at',

      // Documents table
      // Indexes: user_id, last_edited_at for sorting
      documents: 'id, user_id, last_edited_at',

      // Sync status table
      // Primary key: document_id
      syncStatus: 'document_id, is_syncing, last_sync_at',
    });
  }
}

/**
 * Database Singleton Instance
 *
 * Use this instance throughout the application.
 */
export const db = new WritingTimelineDB();

/**
 * Database Utilities
 */
export const dbUtils = {
  /**
   * Clear all local data (for logout/reset)
   */
  async clearAll() {
    await db.events.clear();
    await db.documents.clear();
    await db.syncStatus.clear();
  },

  /**
   * Get database statistics
   */
  async getStats() {
    const [eventCount, documentCount, syncStatusCount] = await Promise.all([
      db.events.count(),
      db.documents.count(),
      db.syncStatus.count(),
    ]);

    return {
      events: eventCount,
      documents: documentCount,
      syncStatuses: syncStatusCount,
    };
  },

  /**
   * Get pending events count for a document
   */
  async getPendingCount(documentId: string): Promise<number> {
    return await db.events
      .where('document_id')
      .equals(documentId)
      .and(event => !event.synced)
      .count();
  },

  /**
   * Check if IndexedDB is available
   */
  isAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  },
};

// Export type for use in other files
export type WritingTimelineDBType = WritingTimelineDB;
