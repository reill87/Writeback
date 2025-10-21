'use client';

import type { PlaybackControls } from '@/hooks/usePlayback';

interface TimelineSliderProps {
  currentTimeMs: number;
  totalTimeMs: number;
  progress: number;
  controls: PlaybackControls;
  className?: string;
}

export default function TimelineSlider({
  currentTimeMs,
  totalTimeMs,
  progress,
  controls,
  className = '',
}: TimelineSliderProps) {
  const handleSeek = (value: number[]) => {
    const targetProgress = value[0];
    const targetTimeMs = (targetProgress / 100) * totalTimeMs;
    controls.seek(targetTimeMs);
  };
  
  return (
    <div className={`timeline-slider ${className}`}>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={(e) => handleSeek([parseFloat(e.target.value)])}
          disabled={totalTimeMs === 0}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
        />
      </div>
      
      {/* Progress indicator */}
      <div className="mt-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Start</span>
          <span>{progress.toFixed(1)}%</span>
          <span>End</span>
        </div>
      </div>
    </div>
  );
}