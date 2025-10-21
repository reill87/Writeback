'use client';

import type { PlaybackSpeed } from '@/hooks/usePlayback';

interface SpeedSelectorProps {
  speed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  className?: string;
}

const SPEED_OPTIONS: { value: PlaybackSpeed; label: string }[] = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
];

export default function SpeedSelector({ 
  speed, 
  onSpeedChange, 
  className = '' 
}: SpeedSelectorProps) {
  return (
    <div className={`speed-selector flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">Speed:</span>
      <select
        value={speed.toString()}
        onChange={(e) => onSpeedChange(parseFloat(e.target.value) as PlaybackSpeed)}
        className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
      >
        {SPEED_OPTIONS.map((option) => (
          <option key={option.value} value={option.value.toString()}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}