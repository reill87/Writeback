'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePlayback } from '@/hooks/usePlayback';
import PlaybackPlayer from '@/components/playback/PlaybackPlayer';
import PlaybackControls from '@/components/playback/PlaybackControls';
import SpeedSelector from '@/components/playback/SpeedSelector';
import TimelineSlider from '@/components/playback/TimelineSlider';
import TimeDisplay from '@/components/playback/TimeDisplay';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { WritingEvent } from '@/types/events';

export default function PlaybackPage() {
  const params = useParams();
  const documentId = params.id as string;
  const [events, setEvents] = useState<WritingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events for the document
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
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
        setEvents(data.events || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (documentId) {
      fetchEvents();
    }
  }, [documentId]);

  const [status, controls] = usePlayback({
    events,
    onFrameUpdate: (frame) => {
      // Frame updates are handled by PlaybackPlayer component
    },
    onComplete: () => {
      console.log('Playback completed');
    },
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <LoadingSpinner size="lg" text="Loading playback..." showText centered />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Playback Error</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-gray-600">No events found for this document.</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Document Playback</h1>
        <p className="text-gray-600">
          Watch how this document was written, event by event.
        </p>
      </div>

      {/* Playback Controls */}
      <div className="mb-6 p-4 bg-white border rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <PlaybackControls state={status.state} controls={controls} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <SpeedSelector 
              speed={status.speed} 
              onSpeedChange={controls.setSpeed} 
            />
            <TimeDisplay 
              currentTime={status.formattedTime}
              totalTime={status.formattedTotalTime}
            />
          </div>
        </div>
        
        <TimelineSlider
          currentTimeMs={status.currentTimeMs}
          totalTimeMs={status.totalTimeMs}
          progress={status.progress}
          controls={controls}
        />
      </div>

      {/* Playback Player */}
      <PlaybackPlayer 
        frame={status.currentFrame}
        className="mb-6"
      />

      {/* Statistics */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Events:</span>
            <div className="font-mono">{events.length}</div>
          </div>
          <div>
            <span className="text-gray-600">Duration:</span>
            <div className="font-mono">{status.formattedTotalTime}</div>
          </div>
          <div>
            <span className="text-gray-600">Speed:</span>
            <div className="font-mono">{status.speed}x</div>
          </div>
          <div>
            <span className="text-gray-600">Progress:</span>
            <div className="font-mono">{status.progress.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}