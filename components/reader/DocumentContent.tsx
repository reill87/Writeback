'use client';

import React from 'react';

interface DocumentContentProps {
  content: string;
  className?: string;
}

/**
 * DocumentContent Component
 *
 * Displays the final document content with beautiful typography.
 *
 * Features:
 * - Preserves line breaks and whitespace
 * - Readable typography optimized for long-form content
 * - Responsive font sizing
 */
export function DocumentContent({ content, className = '' }: DocumentContentProps) {
  // Split content by paragraphs (double newlines)
  const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 0);

  if (!content || content.trim().length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-400 text-lg">This document is empty.</p>
      </div>
    );
  }

  return (
    <article
      className={`prose prose-lg max-w-none ${className}`}
      style={{
        // Custom typography for better readability
        lineHeight: '1.8',
        fontSize: '18px',
      }}
    >
      {paragraphs.map((paragraph, index) => {
        // Handle single line breaks within paragraphs
        const lines = paragraph.split('\n');

        return (
          <p key={index} className="mb-6 text-gray-800 leading-relaxed">
            {lines.map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {line}
                {lineIndex < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </article>
  );
}
