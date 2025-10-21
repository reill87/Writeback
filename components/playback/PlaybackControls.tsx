'use client';

import type { PlaybackState, PlaybackControls } from '@/hooks/usePlayback';

interface PlaybackControlsProps {
  state: PlaybackState;
  controls: PlaybackControls;
  className?: string;
}

export default function PlaybackControls({ 
  state, 
  controls, 
  className = '' 
}: PlaybackControlsProps) {
  const isPlaying = state === 'playing';
  const canPlay = state === 'idle' || state === 'paused' || state === 'completed';
  const canPause = state === 'playing';
  const canStop = state === 'playing' || state === 'paused';
  
  return (
    <div className={`playback-controls flex items-center gap-2 ${className}`}>
      {/* Play/Pause Button */}
      <button
        onClick={isPlaying ? controls.pause : controls.play}
        disabled={!canPlay && !canPause}
        className="w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      
      {/* Stop Button */}
      <button
        onClick={controls.stop}
        disabled={!canStop}
        className="w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        ⏹️
      </button>
      
      {/* State Indicator */}
      <div className="ml-2 text-sm text-gray-600">
        {state === 'idle' && 'Ready'}
        {state === 'playing' && 'Playing'}
        {state === 'paused' && 'Paused'}
        {state === 'completed' && 'Completed'}
      </div>
    </div>
  );
}