'use client';

import { useEffect, useRef } from 'react';
import type { ReplayFrame } from '@/lib/event-sourcing/replay';

interface PlaybackPlayerProps {
  frame: ReplayFrame | null;
  className?: string;
}

export default function PlaybackPlayer({ frame, className = '' }: PlaybackPlayerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousContentRef = useRef<string>('');
  
  useEffect(() => {
    if (!frame || !contentRef.current) return;
    
    const currentContent = frame.content;
    const previousContent = previousContentRef.current;
    
    // Simple content update for MVP
    // Future: Add character-by-character animation, cursor simulation
    contentRef.current.textContent = currentContent;
    
    // Highlight the changed part (simple implementation)
    if (currentContent !== previousContent) {
      contentRef.current.classList.add('playback-flash');
      setTimeout(() => {
        contentRef.current?.classList.remove('playback-flash');
      }, 100);
    }
    
    previousContentRef.current = currentContent;
  }, [frame]);
  
  return (
    <div className={`playback-player ${className}`}>
      <div className="playback-header mb-4">
        <div className="playback-stats flex flex-col sm:flex-row gap-2 sm:gap-4">
          {frame && (
            <>
              <span className="text-xs sm:text-sm text-gray-600">
                Event {frame.eventIndex + 1} / {frame.totalEvents}
              </span>
              <span className="text-xs sm:text-sm text-gray-600">
                {frame.progress.toFixed(1)}%
              </span>
            </>
          )}
        </div>
      </div>
      
      <div className="playback-content-wrapper">
        <div
          ref={contentRef}
          className="playback-content whitespace-pre-wrap font-mono text-xs sm:text-sm p-3 sm:p-4 min-h-[200px] sm:min-h-[300px] bg-gray-50 rounded-md border"
        />
      </div>
      
      <style jsx>{`
        .playback-flash {
          animation: flash 0.1s ease-in-out;
        }
        
        @keyframes flash {
          0% { background-color: rgba(59, 130, 246, 0.1); }
          100% { background-color: transparent; }
        }
      `}</style>
    </div>
  );
}