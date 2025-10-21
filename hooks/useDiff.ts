'use client';

import { useEffect, useState, useCallback } from 'react';
import { compareTexts, type DiffResult } from '@/lib/diff/myers-diff';
import type { WritingEvent } from '@/types/events';
import { EventSourcingEngine } from '@/lib/event-sourcing/engine';

interface DocumentVersion {
  /** Document ID */
  documentId: string;
  /** Version content */
  content: string;
  /** Version timestamp */
  timestamp: number;
  /** Version label */
  label: 'first' | 'final';
  /** Event count at this version */
  eventCount: number;
}

interface UseDiffOptions {
  /** Document ID to fetch versions for */
  documentId: string;
  /** Auto-fetch versions on mount */
  autoFetch?: boolean;
}

interface UseDiffReturn {
  /** First version of the document */
  firstVersion: DocumentVersion | null;
  /** Final version of the document */
  finalVersion: DocumentVersion | null;
  /** Diff result between first and final versions */
  diffResult: DiffResult | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Manually trigger version fetching */
  fetchVersions: () => Promise<void>;
  /** Manually trigger diff calculation */
  calculateDiff: () => void;
  /** Refresh everything */
  refresh: () => Promise<void>;
}

/**
 * useDiff Hook
 * 
 * Fetches first and final versions of a document and calculates diff.
 * 
 * Features:
 * - Fetches document events via API
 * - Reconstructs first and final versions using event sourcing
 * - Calculates diff using Myers algorithm
 * - Handles loading and error states
 * - Supports manual refresh
 * 
 * Usage:
 * ```tsx
 * const { firstVersion, finalVersion, diffResult, loading } = useDiff({
 *   documentId: 'doc-123'
 * });
 * ```
 */
export function useDiff({ documentId, autoFetch = true }: UseDiffOptions): UseDiffReturn {
  const [firstVersion, setFirstVersion] = useState<DocumentVersion | null>(null);
  const [finalVersion, setFinalVersion] = useState<DocumentVersion | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Fetch document versions from API
   */
  const fetchVersions = useCallback(async () => {
    if (!documentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all events for the document
      const response = await fetch(`/api/documents/${documentId}/events`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document not found');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view this document');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      const events: WritingEvent[] = data.events || [];
      
      if (events.length === 0) {
        throw new Error('No events found for this document');
      }
      
      // Sort events by timestamp
      events.sort((a, b) => a.timestamp - b.timestamp);
      
      // Get first version (after first event)
      const firstEvent = events[0];
      const firstResult = EventSourcingEngine.replay([firstEvent]);
      
      const first: DocumentVersion = {
        documentId,
        content: firstResult.content,
        timestamp: firstEvent.timestamp,
        label: 'first',
        eventCount: 1,
      };
      
      // Get final version (after all events)
      const finalResult = EventSourcingEngine.replay(events);
      
      const final: DocumentVersion = {
        documentId,
        content: finalResult.content,
        timestamp: events[events.length - 1].timestamp,
        label: 'final',
        eventCount: events.length,
      };
      
      setFirstVersion(first);
      setFinalVersion(final);
      
      // Auto-calculate diff
      const diff = compareTexts(first.content, final.content);
      setDiffResult(diff);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      console.error('Error fetching versions:', err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);
  
  /**
   * Calculate diff between first and final versions
   */
  const calculateDiff = useCallback(() => {
    if (!firstVersion || !finalVersion) {
      setError('Both versions must be loaded before calculating diff');
      return;
    }
    
    try {
      const diff = compareTexts(firstVersion.content, finalVersion.content);
      setDiffResult(diff);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate diff';
      setError(message);
      console.error('Error calculating diff:', err);
    }
  }, [firstVersion, finalVersion]);
  
  /**
   * Refresh everything
   */
  const refresh = useCallback(async () => {
    setFirstVersion(null);
    setFinalVersion(null);
    setDiffResult(null);
    await fetchVersions();
  }, [fetchVersions]);
  
  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && documentId) {
      fetchVersions();
    }
  }, [autoFetch, documentId, fetchVersions]);
  
  return {
    firstVersion,
    finalVersion,
    diffResult,
    loading,
    error,
    fetchVersions,
    calculateDiff,
    refresh,
  };
}

/**
 * Utility hook for getting document versions only (without diff)
 */
export function useDocumentVersions(documentId: string) {
  const { firstVersion, finalVersion, loading, error, fetchVersions, refresh } = useDiff({
    documentId,
    autoFetch: true,
  });
  
  return {
    firstVersion,
    finalVersion,
    loading,
    error,
    fetchVersions,
    refresh,
  };
}