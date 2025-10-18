'use client';

import React from 'react';
import { useEditorStore } from '@/stores/editor-store';

interface EditorToolbarProps {
  documentTitle: string;
  onTitleChange?: (title: string) => void;
}

/**
 * EditorToolbar Component
 *
 * Displays editor controls and sync status.
 *
 * Features:
 * - Document title editing
 * - Save button with sync status
 * - Pending events indicator
 * - Sync error display
 */
export function EditorToolbar({ documentTitle, onTitleChange }: EditorToolbarProps) {
  const {
    isSaving,
    lastSavedAt,
    pendingEventCount,
    syncError,
    syncNow,
  } = useEditorStore();

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Not saved';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
      {/* Left: Document title */}
      <div className="flex-1">
        <input
          type="text"
          value={documentTitle}
          onChange={(e) => onTitleChange?.(e.target.value)}
          className="text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1 rounded"
          placeholder="Untitled Document"
        />
      </div>

      {/* Right: Sync status and controls */}
      <div className="flex items-center gap-4">
        {/* Pending events indicator */}
        {pendingEventCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span>{pendingEventCount} pending</span>
          </div>
        )}

        {/* Sync status */}
        <div className="text-sm text-gray-600">
          {isSaving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : syncError ? (
            <span className="text-red-600">{syncError}</span>
          ) : (
            <span>{formatTimestamp(lastSavedAt)}</span>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={() => syncNow()}
          disabled={isSaving || pendingEventCount === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
