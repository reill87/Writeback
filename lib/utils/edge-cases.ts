/**
 * Edge Case Utilities
 * 
 * Collection of utilities for handling edge cases and error scenarios
 * in the writing timeline platform.
 */

import type { WritingEvent } from '@/types/events';

/**
 * Document validation utilities
 */
export const DocumentValidator = {
  /**
   * Check if document has sufficient content for meaningful playback
   */
  hasMinimalContent: (content: string): boolean => {
    return content.trim().length >= 10; // At least 10 characters
  },

  /**
   * Check if document has enough events for meaningful playback
   */
  hasMinimalEvents: (events: WritingEvent[]): boolean => {
    return events.length >= 1;
  },

  /**
   * Check if document is too large for optimal performance
   */
  isOversized: (content: string, maxSize: number = 100000): boolean => {
    return content.length > maxSize;
  },

  /**
   * Check if document has too many events for optimal performance
   */
  hasTooManyEvents: (events: WritingEvent[], maxEvents: number = 1000): boolean => {
    return events.length > maxEvents;
  },
};

/**
 * Event validation utilities
 */
export const EventValidator = {
  /**
   * Validate event structure
   */
  isValidEvent: (event: any): event is WritingEvent => {
    return (
      event &&
      typeof event.id === 'string' &&
      typeof event.document_id === 'string' &&
      typeof event.timestamp === 'number' &&
      typeof event.event_type === 'string' &&
      ['insert', 'delete', 'replace'].includes(event.event_type) &&
      typeof event.position === 'number' &&
      event.position >= 0
    );
  },

  /**
   * Check if events are in chronological order
   */
  areEventsChronological: (events: WritingEvent[]): boolean => {
    for (let i = 1; i < events.length; i++) {
      if (events[i].timestamp < events[i - 1].timestamp) {
        return false;
      }
    }
    return true;
  },

  /**
   * Check for duplicate events
   */
  hasDuplicateEvents: (events: WritingEvent[]): boolean => {
    const ids = new Set();
    for (const event of events) {
      if (ids.has(event.id)) {
        return true;
      }
      ids.add(event.id);
    }
    return false;
  },

  /**
   * Check for events with invalid positions
   */
  hasInvalidPositions: (events: WritingEvent[]): boolean => {
    return events.some(event => event.position < 0);
  },
};

/**
 * Content reconstruction utilities
 */
export const ContentReconstructor = {
  /**
   * Handle empty content gracefully
   */
  getEmptyContentMessage: (): string => {
    return "This document appears to be empty or has no content.";
  },

  /**
   * Handle corrupted content gracefully
   */
  getCorruptedContentMessage: (): string => {
    return "This document's content appears to be corrupted. Some content may not display correctly.";
  },

  /**
   * Handle oversized content gracefully
   */
  getOversizedContentMessage: (size: number): string => {
    return `This document is very large (${Math.round(size / 1000)}KB). Loading may take longer than usual.`;
  },
};

/**
 * Playback edge case handlers
 */
export const PlaybackHandler = {
  /**
   * Handle playback with no events
   */
  getNoEventsMessage: (): string => {
    return "This document has no edit history to play back.";
  },

  /**
   * Handle playback with single event
   */
  getSingleEventMessage: (): string => {
    return "This document has only one version. There's no edit history to play back.";
  },

  /**
   * Handle playback with too many events
   */
  getTooManyEventsMessage: (eventCount: number): string => {
    return `This document has ${eventCount} edit events. Playback may be slow. Consider using a faster playback speed.`;
  },

  /**
   * Handle playback with corrupted events
   */
  getCorruptedEventsMessage: (): string => {
    return "Some events in this document appear to be corrupted. Playback may not be accurate.";
  },
};

/**
 * Diff edge case handlers
 */
export const DiffHandler = {
  /**
   * Handle diff with identical content
   */
  getIdenticalContentMessage: (): string => {
    return "The first draft and final version are identical. No changes were made.";
  },

  /**
   * Handle diff with completely different content
   */
  getCompletelyDifferentMessage: (): string => {
    return "The first draft and final version are completely different. This appears to be a complete rewrite.";
  },

  /**
   * Handle diff with minimal changes
   */
  getMinimalChangesMessage: (): string => {
    return "Only minor changes were made between the first draft and final version.";
  },

  /**
   * Handle diff with massive changes
   */
  getMassiveChangesMessage: (): string => {
    return "Significant changes were made between the first draft and final version.";
  },
};

/**
 * Network and API edge case handlers
 */
export const NetworkHandler = {
  /**
   * Handle network timeout
   */
  getTimeoutMessage: (): string => {
    return "The request timed out. Please check your internet connection and try again.";
  },

  /**
   * Handle network error
   */
  getNetworkErrorMessage: (): string => {
    return "Network error occurred. Please check your internet connection and try again.";
  },

  /**
   * Handle server error
   */
  getServerErrorMessage: (status: number): string => {
    if (status >= 500) {
      return "Server error occurred. Please try again later.";
    } else if (status === 404) {
      return "Document not found. It may have been deleted or moved.";
    } else if (status === 403) {
      return "You don't have permission to access this document.";
    } else {
      return `Request failed with status ${status}. Please try again.`;
    }
  },

  /**
   * Handle rate limiting
   */
  getRateLimitMessage: (): string => {
    return "Too many requests. Please wait a moment before trying again.";
  },
};

/**
 * Browser compatibility handlers
 */
export const BrowserHandler = {
  /**
   * Check if browser supports required features
   */
  checkBrowserSupport: (): {
    supported: boolean;
    missingFeatures: string[];
  } => {
    const missingFeatures: string[] = [];

    // Check for required APIs
    if (typeof window === 'undefined') {
      missingFeatures.push('Window object');
    }

    if (typeof document === 'undefined') {
      missingFeatures.push('Document object');
    }

    if (typeof fetch === 'undefined') {
      missingFeatures.push('Fetch API');
    }

    if (typeof Promise === 'undefined') {
      missingFeatures.push('Promise support');
    }

    if (typeof Map === 'undefined') {
      missingFeatures.push('Map support');
    }

    if (typeof Set === 'undefined') {
      missingFeatures.push('Set support');
    }

    return {
      supported: missingFeatures.length === 0,
      missingFeatures,
    };
  },

  /**
   * Get browser support message
   */
  getBrowserSupportMessage: (missingFeatures: string[]): string => {
    return `Your browser is missing required features: ${missingFeatures.join(', ')}. Please update your browser or use a modern browser.`;
  },
};

/**
 * Performance monitoring for edge cases
 */
export const PerformanceMonitor = {
  /**
   * Check if operation is taking too long
   */
  isOperationSlow: (startTime: number, maxDuration: number = 5000): boolean => {
    return Date.now() - startTime > maxDuration;
  },

  /**
   * Get slow operation message
   */
  getSlowOperationMessage: (): string => {
    return "This operation is taking longer than expected. Please wait...";
  },

  /**
   * Check memory usage
   */
  checkMemoryUsage: (): {
    isHigh: boolean;
    message?: string;
  } => {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
      return { isHigh: false };
    }

    const memory = (performance as any).memory;
    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
    const usagePercent = (usedMB / limitMB) * 100;

    if (usagePercent > 80) {
      return {
        isHigh: true,
        message: `High memory usage detected (${Math.round(usagePercent)}%). Performance may be affected.`,
      };
    }

    return { isHigh: false };
  },
};

/**
 * Data sanitization utilities
 */
export const DataSanitizer = {
  /**
   * Sanitize content for display
   */
  sanitizeContent: (content: string): string => {
    // Remove potentially harmful characters while preserving formatting
    return content
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // Remove control characters
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n'); // Convert remaining \r to \n
  },

  /**
   * Sanitize event data
   */
  sanitizeEvent: (event: any): WritingEvent | null => {
    if (!EventValidator.isValidEvent(event)) {
      return null;
    }

    return {
      ...event,
      content: event.content ? DataSanitizer.sanitizeContent(event.content) : null,
      content_before: event.content_before ? DataSanitizer.sanitizeContent(event.content_before) : null,
    };
  },
};

/**
 * Recovery utilities for corrupted data
 */
export const RecoveryHandler = {
  /**
   * Attempt to recover from corrupted events
   */
  recoverFromCorruptedEvents: (events: WritingEvent[]): WritingEvent[] => {
    return events
      .filter(EventValidator.isValidEvent)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  /**
   * Attempt to recover from missing content
   */
  recoverFromMissingContent: (content: string): string => {
    if (!content || content.trim().length === 0) {
      return ContentReconstructor.getEmptyContentMessage();
    }
    return content;
  },
};
