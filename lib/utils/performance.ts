/**
 * Performance Utilities
 * 
 * Collection of utilities for optimizing React component performance
 * and handling large datasets efficiently.
 */

import { useMemo, useCallback, useRef, useState, useEffect } from 'react';

/**
 * Debounce hook for performance optimization
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for performance optimization
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Memoized array operations for large datasets
 */
export function useMemoizedArray<T>(
  array: T[],
  deps: React.DependencyList = []
): T[] {
  return useMemo(() => array, deps);
}

/**
 * Memoized object operations
 */
export function useMemoizedObject<T extends Record<string, any>>(
  obj: T,
  deps: React.DependencyList = []
): T {
  return useMemo(() => obj, deps);
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options, hasIntersected]);

  return { ref, isIntersecting, hasIntersected };
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current} in ${renderTime}ms`);
    }
    
    startTime.current = Date.now();
  });

  return {
    renderCount: renderCount.current,
  };
}

/**
 * Memory usage monitoring (development only)
 */
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

/**
 * Batch state updates for better performance
 */
export function useBatchedUpdates<T>(
  initialState: T,
  batchDelay: number = 16 // ~60fps
) {
  const [state, setState] = useState(initialState);
  const pendingUpdates = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchedSetState = useCallback((newState: T | ((prev: T) => T)) => {
    const update = typeof newState === 'function' 
      ? (newState as (prev: T) => T)(state)
      : newState;
    
    pendingUpdates.current.push(update);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const latestUpdate = pendingUpdates.current[pendingUpdates.current.length - 1];
      setState(latestUpdate);
      pendingUpdates.current = [];
    }, batchDelay);
  }, [state, batchDelay]);

  return [state, batchedSetState] as const;
}

/**
 * Chunk processing for large datasets
 */
export function useChunkedProcessing<T, R>(
  items: T[],
  processor: (chunk: T[]) => R[],
  chunkSize: number = 100
) {
  const [results, setResults] = useState<R[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processChunks = useCallback(async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }

    const allResults: R[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkResults = processor(chunks[i]);
      allResults.push(...chunkResults);
      
      setProgress(((i + 1) / chunks.length) * 100);
      
      // Allow UI to update between chunks
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    setResults(allResults);
    setIsProcessing(false);
  }, [items, processor, chunkSize]);

  return {
    results,
    isProcessing,
    progress,
    processChunks,
  };
}
