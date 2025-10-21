/**
 * Monitoring and Analytics Utilities
 * 
 * Centralized monitoring for performance, errors, and user analytics.
 */

import { Logger } from './error-handler';

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

export interface UserMetrics {
  userId?: string;
  sessionId: string;
  page: string;
  timestamp: number;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  referrer?: string;
}

export interface EventMetrics {
  eventType: 'page_view' | 'document_create' | 'document_publish' | 'playback_start' | 'playback_complete' | 'diff_view';
  userId?: string;
  sessionId: string;
  documentId?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'production';

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (typeof window === 'undefined' || !this.isEnabled) return;

    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor custom metrics
    this.observeCustomMetrics();
  }

  /**
   * Observe Core Web Vitals
   */
  private observeWebVitals(): void {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            this.recordMetric('firstContentfulPaint', entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    }

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('largestContentfulPaint', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.recordMetric('cumulativeLayoutShift', clsValue);
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Observe custom metrics
   */
  private observeCustomMetrics(): void {
    // Page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.recordMetric('pageLoadTime', loadTime);
    });

    // Time to interactive (approximation)
    let ttiStart = 0;
    const checkTTI = () => {
      if (document.readyState === 'complete') {
        const tti = performance.now() - ttiStart;
        this.recordMetric('timeToInteractive', tti);
      } else {
        setTimeout(checkTTI, 100);
      }
    };

    window.addEventListener('load', () => {
      ttiStart = performance.now();
      setTimeout(checkTTI, 100);
    });
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: keyof PerformanceMetrics, value: number): void {
    const metric = {
      [name]: value,
    } as PerformanceMetrics;

    this.metrics.push(metric);
    
    // Send to analytics (in production)
    if (this.isEnabled) {
      this.sendMetrics(metric);
    }
  }

  /**
   * Send metrics to analytics service
   */
  private sendMetrics(metrics: PerformanceMetrics): void {
    // In a real implementation, you would send to your analytics service
    // For now, we'll just log them
    Logger.info('Performance metrics recorded', metrics);
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * User analytics class
 */
export class UserAnalytics {
  private static instance: UserAnalytics;
  private events: EventMetrics[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'production';

  static getInstance(): UserAnalytics {
    if (!UserAnalytics.instance) {
      UserAnalytics.instance = new UserAnalytics();
    }
    return UserAnalytics.instance;
  }

  /**
   * Track a user event
   */
  trackEvent(event: Omit<EventMetrics, 'timestamp' | 'sessionId'>): void {
    const fullEvent: EventMetrics = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
    };

    this.events.push(fullEvent);

    if (this.isEnabled) {
      this.sendEvent(fullEvent);
    }
  }

  /**
   * Track page view
   */
  trackPageView(page: string, userId?: string): void {
    this.trackEvent({
      eventType: 'page_view',
      userId,
      page,
    });
  }

  /**
   * Track document creation
   */
  trackDocumentCreate(userId: string, documentId: string): void {
    this.trackEvent({
      eventType: 'document_create',
      userId,
      documentId,
    });
  }

  /**
   * Track document publication
   */
  trackDocumentPublish(userId: string, documentId: string): void {
    this.trackEvent({
      eventType: 'document_publish',
      userId,
      documentId,
    });
  }

  /**
   * Track playback start
   */
  trackPlaybackStart(userId: string, documentId: string, eventCount: number): void {
    this.trackEvent({
      eventType: 'playback_start',
      userId,
      documentId,
      metadata: { eventCount },
    });
  }

  /**
   * Track playback completion
   */
  trackPlaybackComplete(userId: string, documentId: string, duration: number): void {
    this.trackEvent({
      eventType: 'playback_complete',
      userId,
      documentId,
      metadata: { duration },
    });
  }

  /**
   * Track diff view
   */
  trackDiffView(userId: string, documentId: string): void {
    this.trackEvent({
      eventType: 'diff_view',
      userId,
      documentId,
    });
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Send event to analytics service
   */
  private sendEvent(event: EventMetrics): void {
    // In a real implementation, you would send to your analytics service
    // For now, we'll just log them
    Logger.info('User event tracked', event);
  }

  /**
   * Get all tracked events
   */
  getEvents(): EventMetrics[] {
    return [...this.events];
  }

  /**
   * Clear events
   */
  clearEvents(): void {
    this.events = [];
  }
}

/**
 * Error monitoring class
 */
export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errors: Error[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'production';

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  /**
   * Initialize error monitoring
   */
  init(): void {
    if (typeof window === 'undefined' || !this.isEnabled) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(new Error(event.reason), {
        type: 'unhandledrejection',
        reason: event.reason,
      });
    });
  }

  /**
   * Record an error
   */
  recordError(error: Error, context?: Record<string, any>): void {
    this.errors.push(error);
    
    if (this.isEnabled) {
      this.sendError(error, context);
    }
  }

  /**
   * Send error to monitoring service
   */
  private sendError(error: Error, context?: Record<string, any>): void {
    // In a real implementation, you would send to your error monitoring service
    Logger.error('Error recorded', error, context);
  }

  /**
   * Get all recorded errors
   */
  getErrors(): Error[] {
    return [...this.errors];
  }

  /**
   * Clear errors
   */
  clearErrors(): void {
    this.errors = [];
  }
}

/**
 * Initialize all monitoring
 */
export function initializeMonitoring(): void {
  if (typeof window === 'undefined') return;

  PerformanceMonitor.getInstance().init();
  ErrorMonitor.getInstance().init();
}

/**
 * Get monitoring instance
 */
export function getMonitoring() {
  return {
    performance: PerformanceMonitor.getInstance(),
    analytics: UserAnalytics.getInstance(),
    errors: ErrorMonitor.getInstance(),
  };
}
