'use client';

import React from 'react';
import type { Document, Profile } from '@/types/supabase';

interface DocumentHeaderProps {
  document: Document;
  author?: Profile | null;
  eventCount?: number;
  writingDuration?: string;
  className?: string;
}

/**
 * DocumentHeader Component
 *
 * Displays document metadata: title, author, writing statistics.
 *
 * Features:
 * - Document title
 * - Author name and profile
 * - Writing duration and event count
 * - Publication date
 */
export function DocumentHeader({
  document,
  author,
  eventCount,
  writingDuration,
  className = '',
}: DocumentHeaderProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return null;
    // Duration is expected in format like "2h 30m" or "45m"
    return duration;
  };

  return (
    <header className={`border-b pb-8 mb-8 ${className}`}>
      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        {document.title}
      </h1>

      {/* Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-600">
        {/* Author */}
        {author && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {author.display_name?.[0]?.toUpperCase() || author.username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {author.display_name || author.username}
              </p>
              <p className="text-sm text-gray-500">@{author.username}</p>
            </div>
          </div>
        )}

        {/* Divider */}
        {author && <div className="hidden sm:block w-px h-8 bg-gray-300" />}

        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-sm">
          {/* Publication date */}
          <div>
            <span className="text-gray-500">Published</span>
            <span className="ml-2 text-gray-900 font-medium">
              {formatDate(document.created_at)}
            </span>
          </div>

          {/* Writing duration */}
          {writingDuration && (
            <>
              <span className="text-gray-300">•</span>
              <div>
                <span className="text-gray-500">Writing time</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {formatDuration(writingDuration)}
                </span>
              </div>
            </>
          )}

          {/* Event count */}
          {eventCount !== undefined && (
            <>
              <span className="text-gray-300">•</span>
              <div>
                <span className="text-gray-500">Changes</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {eventCount.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Author bio */}
      {author?.bio && (
        <div className="mt-6 pt-6 border-t">
          <p className="text-gray-600 text-sm">{author.bio}</p>
        </div>
      )}
    </header>
  );
}
