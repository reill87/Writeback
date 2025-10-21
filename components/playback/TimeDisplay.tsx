'use client';

interface TimeDisplayProps {
  currentTime: string;
  totalTime: string;
  className?: string;
}

export default function TimeDisplay({ 
  currentTime, 
  totalTime, 
  className = '' 
}: TimeDisplayProps) {
  return (
    <div className={`time-display flex items-center gap-1 ${className}`}>
      <span className="font-mono text-sm tabular-nums">
        {currentTime}
      </span>
      <span className="text-muted-foreground">/</span>
      <span className="font-mono text-sm tabular-nums text-muted-foreground">
        {totalTime}
      </span>
    </div>
  );
}