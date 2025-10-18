'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import type { WritingEventInsert, EventType } from '@/types/events';

interface TextEditorProps {
  documentId: string;
  initialContent?: string;
  placeholder?: string;
  maxLength?: number;
}

/**
 * TextEditor Component
 *
 * Core text editing component that captures all writing events.
 *
 * Features:
 * - Captures insert, delete, and replace events
 * - Tracks cursor position
 * - Enforces character limit
 * - Auto-queues events to IndexedDB
 */
export function TextEditor({
  documentId,
  initialContent = '',
  placeholder = '여기에 글을 작성하세요...',
  maxLength = 50000,
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastContentRef = useRef<string>(initialContent);

  const {
    content,
    cursorPosition,
    initDocument,
    updateContent,
    setCursorPosition,
  } = useEditorStore();

  // Initialize document on mount
  useEffect(() => {
    initDocument(documentId, initialContent);
    lastContentRef.current = initialContent;
  }, [documentId, initialContent, initDocument]);

  // Restore cursor position after updates
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.selectionStart = cursorPosition;
      textareaRef.current.selectionEnd = cursorPosition;
    }
  }, [cursorPosition]);

  /**
   * Create writing event from content change
   */
  const createEvent = useCallback(
    (
      oldContent: string,
      newContent: string,
      cursorPos: number
    ): WritingEventInsert | null => {
      const timestamp = Date.now();

      // Find the difference
      let position = 0;
      const minLength = Math.min(oldContent.length, newContent.length);

      // Find first difference position
      while (position < minLength && oldContent[position] === newContent[position]) {
        position++;
      }

      const oldRest = oldContent.slice(position);
      const newRest = newContent.slice(position);

      // Determine event type
      let eventType: EventType;
      let eventContent: string | null = null;
      let contentBefore: string | null = null;

      if (oldContent.length < newContent.length) {
        // INSERT
        eventType = 'insert';
        eventContent = newContent.slice(position, position + (newContent.length - oldContent.length));
      } else if (oldContent.length > newContent.length) {
        // DELETE
        eventType = 'delete';
        contentBefore = oldContent.slice(position, position + (oldContent.length - newContent.length));
      } else if (oldRest !== newRest) {
        // REPLACE (same length but different content)
        eventType = 'replace';
        const replaceLength = oldRest.length;
        eventContent = newRest;
        contentBefore = oldRest;
      } else {
        // No change
        return null;
      }

      return {
        document_id: documentId,
        session_id: '', // Will be filled by store
        timestamp,
        event_type: eventType,
        position,
        content: eventContent,
        content_before: contentBefore,
      };
    },
    [documentId]
  );

  /**
   * Handle text change
   */
  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      const newCursorPos = e.target.selectionStart;

      // Enforce character limit
      if (newContent.length > maxLength) {
        return;
      }

      // Create event
      const event = createEvent(lastContentRef.current, newContent, newCursorPos);

      if (event) {
        // Update store (will queue event)
        await updateContent(newContent, newCursorPos, event);
      }

      // Update refs
      lastContentRef.current = newContent;
    },
    [createEvent, maxLength, updateContent]
  );

  /**
   * Handle selection change (cursor movement)
   */
  const handleSelectionChange = useCallback(() => {
    if (textareaRef.current) {
      const newPos = textareaRef.current.selectionStart;
      setCursorPosition(newPos);
    }
  }, [setCursorPosition]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + S: Save (prevent default browser save)
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      useEditorStore.getState().syncNow();
    }
  }, []);

  const characterCount = content.length;
  const isNearLimit = characterCount > maxLength * 0.9;

  return (
    <div className="flex flex-col h-full">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onSelect={handleSelectionChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 w-full p-6 text-lg resize-none focus:outline-none font-mono"
        style={{
          minHeight: '500px',
        }}
      />
      <div className="flex items-center justify-between px-6 py-2 text-sm text-gray-500 border-t">
        <div>
          <span className={isNearLimit ? 'text-orange-600 font-medium' : ''}>
            {characterCount.toLocaleString()}
          </span>
          <span className="mx-1">/</span>
          <span>{maxLength.toLocaleString()}</span>
          <span className="ml-1">characters</span>
        </div>
      </div>
    </div>
  );
}
