'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  replayEvents,
  replayEventsFromIndex,
  getTotalDuration,
  formatDuration,
  findEventIndexAtPlaybackTime,
  reconstructContentUpToIndex,
  type ReplayFrame
} from '@/lib/event-sourcing/replay';
import { delay } from '@/lib/utils/time';
import type { WritingEvent } from '@/types/events';

export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'completed';

export interface PlaybackControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (timeMs: number) => Promise<void>;
  setSpeed: (speed: PlaybackSpeed) => void;
}

export interface PlaybackStatus {
  state: PlaybackState;
  currentTimeMs: number;
  totalTimeMs: number;
  currentFrame: ReplayFrame | null;
  progress: number;
  speed: PlaybackSpeed;
  formattedTime: string;
  formattedTotalTime: string;
}

interface UsePlaybackOptions {
  events: WritingEvent[];
  onFrameUpdate?: (frame: ReplayFrame) => void;
  onComplete?: () => void;
}

export function usePlayback({
  events,
  onFrameUpdate,
  onComplete,
}: UsePlaybackOptions): [PlaybackStatus, PlaybackControls] {
  const [state, setState] = useState<PlaybackState>('idle');
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [currentFrame, setCurrentFrame] = useState<ReplayFrame | null>(null);
  
  const generatorRef = useRef<AsyncGenerator<ReplayFrame> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  
  const totalTimeMs = getTotalDuration(events, speed);
  const progress = totalTimeMs > 0 ? (currentTimeMs / totalTimeMs) * 100 : 0;
  
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    generatorRef.current = null;
  }, []);
  
  const play = useCallback(async () => {
    if (state === 'playing' || events.length === 0) return;
    
    setState('playing');
    
    // Create new abort controller for this playback session
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;
    
    try {
      // Resume from paused position or start fresh
      if (state === 'paused' && generatorRef.current) {
        startTimeRef.current = Date.now() - pausedTimeRef.current;
      } else {
        generatorRef.current = replayEvents(events, speed);
        startTimeRef.current = Date.now();
        setCurrentTimeMs(0);
      }
      
      // Playback loop
      for await (const frame of generatorRef.current) {
        if (abortSignal.aborted) break;
        
        // Update frame
        setCurrentFrame(frame);
        onFrameUpdate?.(frame);
        
        // Update time tracking
        const elapsedMs = Date.now() - startTimeRef.current;
        setCurrentTimeMs(elapsedMs);
        
        // Wait for next frame with abort check
        if (frame.delayMs > 0) {
          await delay(frame.delayMs).catch(() => {
            // Cancelled during delay
          });
        }
        
        if (abortSignal.aborted) break;
      }
      
      // Playback completed
      if (!abortSignal.aborted) {
        setState('completed');
        setCurrentTimeMs(totalTimeMs);
        onComplete?.();
      }
    } catch (error) {
      console.error('Playback error:', error);
      setState('idle');
      // Could add onError callback here if needed
    }
  }, [state, events, speed, totalTimeMs, onFrameUpdate, onComplete]);
  
  const pause = useCallback(() => {
    if (state !== 'playing') return;
    
    pausedTimeRef.current = Date.now() - startTimeRef.current;
    cleanup();
    setState('paused');
  }, [state, cleanup]);
  
  const stop = useCallback(() => {
    cleanup();
    setState('idle');
    setCurrentTimeMs(0);
    setCurrentFrame(null);
    pausedTimeRef.current = 0;
  }, [cleanup]);
  
  const seek = useCallback(async (timeMs: number) => {
    if (events.length === 0) return;

    // Clamp to valid range
    const targetTimeMs = Math.max(0, Math.min(timeMs, totalTimeMs));

    // Find target event index
    const targetIndex = findEventIndexAtPlaybackTime(events, targetTimeMs, speed);

    // Store current playback state
    const wasPlaying = state === 'playing';

    // Stop current playback
    cleanup();

    // Reconstruct content and frame at target position
    const content = reconstructContentUpToIndex(events, targetIndex);
    const targetEvent = events[targetIndex];

    const newFrame: ReplayFrame = {
      content,
      event: targetEvent,
      eventIndex: targetIndex,
      totalEvents: events.length,
      progress: ((targetIndex + 1) / events.length) * 100,
      delayMs: 0,
    };

    // Update state
    setCurrentFrame(newFrame);
    setCurrentTimeMs(targetTimeMs);

    // If was playing, resume from new position
    if (wasPlaying) {
      setState('playing');

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const abortSignal = abortControllerRef.current.signal;

      // Start playback from target index
      generatorRef.current = replayEventsFromIndex(events, targetIndex + 1, speed);
      startTimeRef.current = Date.now() - targetTimeMs;

      try {
        for await (const frame of generatorRef.current) {
          if (abortSignal.aborted) break;

          setCurrentFrame(frame);
          onFrameUpdate?.(frame);

          const elapsedMs = Date.now() - startTimeRef.current;
          setCurrentTimeMs(elapsedMs);

          if (frame.delayMs > 0) {
            await delay(frame.delayMs).catch(() => {});
          }

          if (abortSignal.aborted) break;
        }

        if (!abortSignal.aborted) {
          setState('completed');
          setCurrentTimeMs(totalTimeMs);
          onComplete?.();
        }
      } catch (error) {
        console.error('Playback error after seek:', error);
        setState('idle');
      }
    } else {
      // If was paused/idle/completed, update state and prepare for resume
      if (state === 'paused' || state === 'completed') {
        setState('paused');
        // Set up generator for when play is pressed
        generatorRef.current = replayEventsFromIndex(events, targetIndex + 1, speed);
        pausedTimeRef.current = targetTimeMs;
      } else {
        // idle state
        setState('idle');
      }
    }
  }, [events, totalTimeMs, speed, state, cleanup, onFrameUpdate, onComplete]);
  
  const handleSetSpeed = useCallback((newSpeed: PlaybackSpeed) => {
    setSpeed(newSpeed);
    // If playing, restart with new speed
    if (state === 'playing') {
      stop();
      setTimeout(() => play(), 0);
    }
  }, [state, play, stop]);
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  const status: PlaybackStatus = {
    state,
    currentTimeMs,
    totalTimeMs,
    currentFrame,
    progress,
    speed,
    formattedTime: formatDuration(currentTimeMs),
    formattedTotalTime: formatDuration(totalTimeMs),
  };
  
  const controls: PlaybackControls = {
    play,
    pause,
    stop,
    seek,
    setSpeed: handleSetSpeed,
  };
  
  return [status, controls];
}