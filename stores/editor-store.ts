import { create } from 'zustand';
import { SyncQueueManager } from '@/lib/db/sync-queue';
import type { WritingEventInsert, DocumentState } from '@/types/events';

/**
 * Editor Store State
 */
interface EditorState {
  // Current document being edited
  currentDocument: DocumentState | null;

  // Current session ID for grouping events
  sessionId: string;

  // Content state
  content: string;
  cursorPosition: number;

  // Sync state
  isSaving: boolean;
  lastSavedAt: string | null;
  pendingEventCount: number;
  syncError: string | null;

  // Actions
  initDocument: (documentId: string, initialContent: string) => void;
  updateContent: (
    newContent: string,
    cursorPosition: number,
    event: WritingEventInsert
  ) => Promise<void>;
  setCursorPosition: (position: number) => void;
  startNewSession: () => void;
  syncNow: () => Promise<void>;
  clearDocument: () => void;
}

/**
 * Editor Store
 *
 * Manages the state of the text editor and coordinates with the event sourcing system.
 *
 * Responsibilities:
 * - Track current content and cursor position
 * - Queue writing events to IndexedDB
 * - Coordinate synchronization to server
 * - Manage writing sessions
 */
export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  currentDocument: null,
  sessionId: crypto.randomUUID(),
  content: '',
  cursorPosition: 0,
  isSaving: false,
  lastSavedAt: null,
  pendingEventCount: 0,
  syncError: null,

  /**
   * Initialize a document for editing
   */
  initDocument: (documentId: string, initialContent: string) => {
    const newSessionId = crypto.randomUUID();

    set({
      currentDocument: {
        id: documentId,
        content: initialContent,
        cursor_position: 0,
        is_saving: false,
        last_saved_at: null,
        pending_events: 0,
      },
      sessionId: newSessionId,
      content: initialContent,
      cursorPosition: 0,
      isSaving: false,
      lastSavedAt: null,
      pendingEventCount: 0,
      syncError: null,
    });
  },

  /**
   * Update content and queue event
   *
   * This is called on every keystroke/edit.
   */
  updateContent: async (
    newContent: string,
    cursorPosition: number,
    event: WritingEventInsert
  ) => {
    const state = get();

    // Update local state immediately for responsive UI
    set({
      content: newContent,
      cursorPosition,
      currentDocument: state.currentDocument
        ? {
            ...state.currentDocument,
            content: newContent,
            cursor_position: cursorPosition,
          }
        : null,
    });

    try {
      // Queue event to IndexedDB
      await SyncQueueManager.enqueue({
        ...event,
        session_id: state.sessionId,
      });

      // Update pending count
      const pendingCount = await SyncQueueManager.getPending(
        event.document_id
      ).then((events) => events.length);

      set({
        pendingEventCount: pendingCount,
        syncError: null,
      });

      // Auto-sync if we have more than 10 pending events
      if (pendingCount >= 10) {
        get().syncNow();
      }
    } catch (error) {
      console.error('Failed to queue event:', error);
      set({
        syncError: error instanceof Error ? error.message : 'Failed to queue event',
      });
    }
  },

  /**
   * Update cursor position without creating an event
   */
  setCursorPosition: (position: number) => {
    set({ cursorPosition: position });
  },

  /**
   * Start a new writing session
   *
   * Call this when:
   * - User takes a long break (15+ minutes)
   * - User explicitly saves
   * - Document is reopened
   */
  startNewSession: () => {
    const newSessionId = crypto.randomUUID();
    console.log('Starting new session:', newSessionId);
    set({ sessionId: newSessionId });
  },

  /**
   * Synchronize pending events to server
   */
  syncNow: async () => {
    const state = get();

    if (!state.currentDocument || state.isSaving) {
      return;
    }

    set({ isSaving: true, syncError: null });

    try {
      const success = await SyncQueueManager.sync(state.currentDocument.id);

      if (success) {
        const pendingCount = await SyncQueueManager.getPending(
          state.currentDocument.id
        ).then((events) => events.length);

        set({
          isSaving: false,
          lastSavedAt: new Date().toISOString(),
          pendingEventCount: pendingCount,
          syncError: null,
        });
      } else {
        set({
          isSaving: false,
          syncError: 'Sync failed. Will retry automatically.',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      set({
        isSaving: false,
        syncError: error instanceof Error ? error.message : 'Sync failed',
      });
    }
  },

  /**
   * Clear current document state
   */
  clearDocument: () => {
    set({
      currentDocument: null,
      content: '',
      cursorPosition: 0,
      isSaving: false,
      lastSavedAt: null,
      pendingEventCount: 0,
      syncError: null,
    });
  },
}));

// Auto-sync interval (every 30 seconds)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useEditorStore.getState();
    if (state.currentDocument && state.pendingEventCount > 0) {
      state.syncNow();
    }
  }, 30000);
}
