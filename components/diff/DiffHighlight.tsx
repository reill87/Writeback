'use client';

import { useMemo } from 'react';
import type { DiffResult, DiffChange } from '@/lib/diff/myers-diff';

interface DiffHighlightProps {
  /** Diff result containing changes */
  diffResult: DiffResult;
  /** Original content (for reference) */
  firstContent: string;
  /** Modified content (for reference) */
  finalContent: string;
  /** Display mode */
  mode?: 'side-by-side' | 'unified';
  /** Additional CSS classes */
  className?: string;
}

/**
 * DiffHighlight Component
 * 
 * Renders diff changes with color-coded highlighting.
 * 
 * Features:
 * - Side-by-side view (default)
 * - Unified view option
 * - Color coding: green (additions), red (deletions), gray (unchanged)
 * - Line numbers
 * - Responsive design
 */
export function DiffHighlight({
  diffResult,
  firstContent,
  finalContent,
  mode = 'side-by-side',
  className = '',
}: DiffHighlightProps) {
  // Split changes for side-by-side view
  const { leftChanges, rightChanges } = useMemo(() => {
    const left: Array<{ type: 'equal' | 'delete'; text: string; lineNum: number }> = [];
    const right: Array<{ type: 'equal' | 'insert'; text: string; lineNum: number }> = [];
    
    let leftLineNum = 1;
    let rightLineNum = 1;
    
    for (const change of diffResult.changes) {
      switch (change.type) {
        case 'equal':
          // Add to both sides
          const lines = change.text.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (i === lines.length - 1 && lines[i] === '') break; // Skip empty last line
            
            left.push({
              type: 'equal',
              text: lines[i],
              lineNum: leftLineNum++,
            });
            
            right.push({
              type: 'equal', 
              text: lines[i],
              lineNum: rightLineNum++,
            });
          }
          break;
          
        case 'delete':
          // Add to left side only
          const deletedLines = change.text.split('\n');
          for (let i = 0; i < deletedLines.length; i++) {
            if (i === deletedLines.length - 1 && deletedLines[i] === '') break;
            
            left.push({
              type: 'delete',
              text: deletedLines[i],
              lineNum: leftLineNum++,
            });
          }
          break;
          
        case 'insert':
          // Add to right side only
          const insertedLines = change.text.split('\n');
          for (let i = 0; i < insertedLines.length; i++) {
            if (i === insertedLines.length - 1 && insertedLines[i] === '') break;
            
            right.push({
              type: 'insert',
              text: insertedLines[i],
              lineNum: rightLineNum++,
            });
          }
          break;
      }
    }
    
    return { leftChanges: left, rightChanges: right };
  }, [diffResult.changes]);
  
  if (mode === 'unified') {
    return (
      <div className={`diff-highlight-unified ${className}`}>
        <div className="font-mono text-sm bg-white">
          {diffResult.changes.map((change, index) => (
            <div
              key={index}
              className={`
                px-4 py-1 border-l-2
                ${change.type === 'insert' 
                  ? 'bg-green-50 border-green-500 text-green-800' 
                  : change.type === 'delete'
                  ? 'bg-red-50 border-red-500 text-red-800'
                  : 'bg-white border-gray-200 text-gray-700'
                }
              `}
            >
              <span className="text-gray-400 text-xs mr-2">
                {change.type === 'insert' ? '+' : change.type === 'delete' ? '-' : ' '}
              </span>
              <span className="whitespace-pre-wrap">{change.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Side-by-side view
  return (
    <div className={`diff-highlight-side-by-side ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 font-mono text-sm min-h-64">
        {/* Left side (original/deletions) */}
        <div className="bg-white border-r lg:border-r border-b lg:border-b-0 border-gray-200">
          {leftChanges.map((line, index) => (
            <div
              key={`left-${index}`}
              className={`
                flex border-b border-gray-100 min-h-[1.5rem]
                ${line.type === 'delete' 
                  ? 'bg-red-50' 
                  : 'bg-white hover:bg-gray-50'
                }
              `}
            >
              <div className="w-12 px-2 py-1 text-gray-400 text-xs bg-gray-50 border-r border-gray-200 flex-shrink-0">
                {line.lineNum}
              </div>
              <div 
                className={`
                  px-3 py-1 flex-1 whitespace-pre-wrap
                  ${line.type === 'delete' ? 'text-red-800' : 'text-gray-700'}
                `}
              >
                {line.text || ' '}
              </div>
            </div>
          ))}
        </div>
        
        {/* Right side (modified/additions) */}
        <div className="bg-white">
          {rightChanges.map((line, index) => (
            <div
              key={`right-${index}`}
              className={`
                flex border-b border-gray-100 min-h-[1.5rem]
                ${line.type === 'insert' 
                  ? 'bg-green-50' 
                  : 'bg-white hover:bg-gray-50'
                }
              `}
            >
              <div className="w-12 px-2 py-1 text-gray-400 text-xs bg-gray-50 border-r border-gray-200 flex-shrink-0">
                {line.lineNum}
              </div>
              <div 
                className={`
                  px-3 py-1 flex-1 whitespace-pre-wrap
                  ${line.type === 'insert' ? 'text-green-800' : 'text-gray-700'}
                `}
              >
                {line.text || ' '}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}