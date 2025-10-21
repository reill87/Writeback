'use client';

import { DiffHighlight } from './DiffHighlight';
import type { DiffResult } from '@/lib/diff/myers-diff';

interface DocumentVersion {
  documentId: string;
  content: string;
  timestamp: number;
  label: 'first' | 'final';
  eventCount: number;
}

interface DiffViewerProps {
  /** First version (left side) */
  firstVersion: DocumentVersion | null;
  /** Final version (right side) */
  finalVersion: DocumentVersion | null;
  /** Diff result */
  diffResult: DiffResult | null;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DiffViewer Component
 * 
 * Side-by-side comparison of two document versions with highlighted changes.
 * 
 * Features:
 * - Split view layout (first vs final)
 * - Syntax highlighting for changes
 * - Statistics display
 * - Responsive design
 * - Loading and error states
 */
export function DiffViewer({
  firstVersion,
  finalVersion,
  diffResult,
  loading = false,
  error = null,
  className = '',
}: DiffViewerProps) {
  // Loading state
  if (loading) {
    return (
      <div className={`diff-viewer ${className}`}>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-600">Loading diff...</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`diff-viewer ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Error loading diff</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      </div>
    );
  }
  
  // No data state
  if (!firstVersion || !finalVersion || !diffResult) {
    return (
      <div className={`diff-viewer ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-600">No diff data available</div>
        </div>
      </div>
    );
  }
  
  const { stats } = diffResult;
  
  return (
    <div className={`diff-viewer ${className}`}>
      {/* Header with statistics */}
      <div className="diff-header bg-white border border-gray-200 rounded-t-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Document Comparison
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">{stats.additions} additions</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-600">{stats.deletions} deletions</span>
              </div>
              <div className="text-gray-600">
                {stats.similarity}% similarity
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 whitespace-nowrap">
            {firstVersion.eventCount} → {finalVersion.eventCount} events
          </div>
        </div>
      </div>
      
      {/* Version headers */}
      <div className="diff-version-headers bg-gray-50 border-l border-r border-gray-200 grid grid-cols-1 lg:grid-cols-2">
        <div className="p-3 border-r lg:border-r border-b lg:border-b-0 border-gray-200">
          <div className="font-medium text-gray-900 text-sm sm:text-base">First Draft</div>
          <div className="text-xs sm:text-sm text-gray-600">
            {new Date(firstVersion.timestamp).toLocaleString()}
          </div>
        </div>
        <div className="p-3">
          <div className="font-medium text-gray-900 text-sm sm:text-base">Final Version</div>
          <div className="text-xs sm:text-sm text-gray-600">
            {new Date(finalVersion.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* Diff content */}
      <div className="diff-content border-l border-r border-b border-gray-200 rounded-b-lg">
        <DiffHighlight
          diffResult={diffResult}
          firstContent={firstVersion.content}
          finalContent={finalVersion.content}
        />
      </div>
      
      {/* Statistics footer */}
      <div className="diff-footer mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Changes:</span>
            <div className="font-mono text-lg">
              {stats.additions + stats.deletions}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Additions:</span>
            <div className="font-mono text-lg text-green-600">
              +{stats.additions}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Deletions:</span>
            <div className="font-mono text-lg text-red-600">
              -{stats.deletions}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Unchanged:</span>
            <div className="font-mono text-lg text-gray-600">
              {stats.unchanged}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}