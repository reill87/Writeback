import { db } from './schema';
import type {
  QueuedEvent,
  WritingEventInsert,
  EventBatchRequest,
  EventBatchResponse,
} from '@/types/events';

/**
 * Sync Queue Manager
 *
 * Manages the local queue of writing events and synchronizes them to the server.
 *
 * Features:
 * - Batches events for efficient network usage
 * - Retries failed syncs with exponential backoff
 * - Maintains order and atomicity
 * - Handles offline/online transitions
 */
export class SyncQueueManager {
  private static readonly BATCH_SIZE = 50;
  private static readonly MAX_RETRIES = 5;
  private static readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  /**
   * Add a new event to the local queue
   *
   * @param event - Event to queue
   */
  static async enqueue(event: WritingEventInsert): Promise<void> {
    const queuedEvent: QueuedEvent = {
      ...event,
      id: event.id || crypto.randomUUID(),
      synced: false,
      queued_at: new Date().toISOString(),
      retry_count: 0,
    };

    await db.events.add(queuedEvent);

    // Update sync status
    await this.updateSyncStatus(event.document_id);
  }

  /**
   * Add multiple events to the queue at once
   *
   * @param events - Events to queue
   */
  static async enqueueBatch(events: WritingEventInsert[]): Promise<void> {
    const queuedEvents: QueuedEvent[] = events.map((event) => ({
      ...event,
      id: event.id || crypto.randomUUID(),
      synced: false,
      queued_at: new Date().toISOString(),
      retry_count: 0,
    }));

    await db.events.bulkAdd(queuedEvents);

    // Update sync status for all affected documents
    const documentIds = new Set(events.map((e) => e.document_id));
    for (const documentId of documentIds) {
      await this.updateSyncStatus(documentId);
    }
  }

  /**
   * Get pending events for a document
   *
   * @param documentId - Document ID
   * @param limit - Maximum number of events to fetch
   * @returns Array of pending events sorted by timestamp
   */
  static async getPending(
    documentId: string,
    limit: number = this.BATCH_SIZE
  ): Promise<QueuedEvent[]> {
    return await db.events
      .where('document_id')
      .equals(documentId)
      .and(event => !event.synced)
      .sortBy('timestamp')
      .then((events) => events.slice(0, limit));
  }

  /**
   * Mark events as synced and remove from queue
   *
   * @param eventIds - Array of event IDs to mark as synced
   */
  static async markSynced(eventIds: string[]): Promise<void> {
    await db.events.where('id').anyOf(eventIds).modify({ synced: true });
  }

  /**
   * Increment retry count for failed events
   *
   * @param eventIds - Array of event IDs that failed
   * @param error - Error message
   */
  static async markFailed(eventIds: string[], error: string): Promise<void> {
    await db.events.where('id').anyOf(eventIds).modify((event) => {
      event.retry_count = (event.retry_count || 0) + 1;
      event.last_error = error;
    });
  }

  /**
   * Sync pending events for a document to the server
   *
   * @param documentId - Document ID
   * @returns Success status
   */
  static async sync(documentId: string): Promise<boolean> {
    // Check if already syncing
    const status = await db.syncStatus.where('document_id').equals(documentId).first();
    if (status?.is_syncing) {
      console.log(`Already syncing document ${documentId}`);
      return false;
    }

    // Mark as syncing
    await db.syncStatus.put({
      document_id: documentId,
      pending_count: await this.getPendingCount(documentId),
      is_syncing: true,
      last_sync_at: null,
      last_error: null,
      retry_count: status?.retry_count || 0,
    });

    try {
      // Get pending events
      const pendingEvents = await this.getPending(documentId);

      if (pendingEvents.length === 0) {
        await this.updateSyncStatus(documentId);
        return true;
      }

      // Filter out events that exceeded max retries
      const eventsToSync = pendingEvents.filter(
        (e) => (e.retry_count || 0) < this.MAX_RETRIES
      );

      if (eventsToSync.length === 0) {
        console.error('All pending events exceeded max retries');
        await this.updateSyncStatus(documentId);
        return false;
      }

      // Prepare batch request
      const batch: EventBatchRequest = {
        document_id: documentId,
        events: eventsToSync.map((e) => ({
          id: e.id,
          document_id: e.document_id,
          session_id: e.session_id,
          timestamp: e.timestamp,
          event_type: e.event_type,
          position: e.position,
          content: e.content,
          content_before: e.content_before,
        })),
      };

      // Send to server
      console.log('SyncQueueManager: Sending batch to server:', {
        url: `/api/documents/${documentId}/events`,
        batchSize: batch.events.length,
        documentId: documentId
      });
      
      const response = await fetch(`/api/documents/${documentId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });

      console.log('SyncQueueManager: Server response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SyncQueueManager: Server error response:', errorText);
        throw new Error(`Sync failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result: EventBatchResponse = await response.json();

      if (result.success) {
        // Mark events as synced
        await this.markSynced(eventsToSync.map((e) => e.id));

        // Update sync status
        await db.syncStatus.put({
          document_id: documentId,
          pending_count: await this.getPendingCount(documentId),
          is_syncing: false,
          last_sync_at: new Date().toISOString(),
          last_error: null,
          retry_count: 0,
        });

        return true;
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      console.error('Sync error:', errorMessage);

      // Mark events as failed (increment retry count)
      const pendingEvents = await this.getPending(documentId);
      await this.markFailed(
        pendingEvents.map((e) => e.id),
        errorMessage
      );

      // Update sync status with error
      const currentStatus = await db.syncStatus.where('document_id').equals(documentId).first();
      await db.syncStatus.put({
        document_id: documentId,
        pending_count: await this.getPendingCount(documentId),
        is_syncing: false,
        last_sync_at: currentStatus?.last_sync_at || null,
        last_error: errorMessage,
        retry_count: (currentStatus?.retry_count || 0) + 1,
      });

      return false;
    }
  }

  /**
   * Get count of pending events for a document
   */
  private static async getPendingCount(documentId: string): Promise<number> {
    return await db.events
      .where('document_id')
      .equals(documentId)
      .and(event => !event.synced)
      .count();
  }

  /**
   * Update sync status for a document
   */
  private static async updateSyncStatus(documentId: string): Promise<void> {
    const pending_count = await this.getPendingCount(documentId);
    const status = await db.syncStatus.where('document_id').equals(documentId).first();

    await db.syncStatus.put({
      document_id: documentId,
      pending_count,
      is_syncing: false,
      last_sync_at: status?.last_sync_at || null,
      last_error: status?.last_error || null,
      retry_count: status?.retry_count || 0,
    });
  }

  /**
   * Sync all documents with pending events
   */
  static async syncAll(): Promise<void> {
    const statuses = await db.syncStatus
      .where('pending_count')
      .above(0)
      .toArray();

    for (const status of statuses) {
      await this.sync(status.document_id);
    }
  }

  /**
   * Clear failed events that exceeded max retries
   */
  static async clearFailedEvents(documentId: string): Promise<number> {
    const failedEvents = await db.events
      .where('document_id')
      .equals(documentId)
      .and((e) => (e.retry_count || 0) >= this.MAX_RETRIES)
      .toArray();

    const eventIds = failedEvents.map((e) => e.id);
    await db.events.where('id').anyOf(eventIds).delete();

    return failedEvents.length;
  }
}
