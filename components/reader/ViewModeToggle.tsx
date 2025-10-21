'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ViewModeToggleProps {
  documentId: string;
  className?: string;
}

type ViewMode = 'read' | 'playback' | 'diff';

/**
 * ViewModeToggle Component
 *
 * Toggle buttons for switching between different view modes.
 *
 * Modes:
 * - Read: Final document content (default)
 * - Playback: Timeline animation of writing process
 * - Diff: Side-by-side comparison of first vs final draft
 */
export function ViewModeToggle({ documentId, className = '' }: ViewModeToggleProps) {
  const pathname = usePathname();

  // Determine current mode from pathname
  const getCurrentMode = (): ViewMode => {
    if (pathname.includes('/playback')) return 'playback';
    if (pathname.includes('/diff')) return 'diff';
    return 'read';
  };

  const currentMode = getCurrentMode();

  const modes = [
    {
      id: 'read' as ViewMode,
      label: '최종본',
      href: `/read/${documentId}`,
      description: 'Read final version',
    },
    {
      id: 'playback' as ViewMode,
      label: '타임라인 재생',
      href: `/documents/${documentId}/playback`,
      description: 'Watch writing process',
    },
    {
      id: 'diff' as ViewMode,
      label: '비교',
      href: `/read/${documentId}/diff`,
      description: 'Compare first vs final',
    },
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;

        return (
          <Link
            key={mode.id}
            href={mode.href}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-colors
              ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
            title={mode.description}
          >
            {mode.label}
          </Link>
        );
      })}
    </div>
  );
}
