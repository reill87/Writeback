'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePlayback } from '@/hooks/usePlayback';
import PlaybackPlayer from '@/components/playback/PlaybackPlayer';
import PlaybackControls from '@/components/playback/PlaybackControls';
import SpeedSelector from '@/components/playback/SpeedSelector';
import TimelineSlider from '@/components/playback/TimelineSlider';
import TimeDisplay from '@/components/playback/TimeDisplay';
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
          throw new Error('Failed to fetch events');
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
        <div className="text-center">Loading playback...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-red-600">Error: {error}</div>
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Document Playback</h1>
        <p className="text-gray-600">
          Watch how this document was written, event by event.
        </p>
      </div>

      {/* Playback Controls */}
      <div className="mb-6 p-4 bg-white border rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <PlaybackControls state={status.state} controls={controls} />
          <div className="flex items-center gap-4">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
    </div>
  );
}