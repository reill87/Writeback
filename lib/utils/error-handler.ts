/**
 * Error Handling Utilities
 * 
 * Centralized error handling for API routes and client-side operations.
 * Provides consistent error responses and logging.
 */

import { NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Common error codes and messages
 */
export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Error message templates
 */
export const ErrorMessages = {
  [ErrorCodes.UNAUTHORIZED]: 'Authentication required',
  [ErrorCodes.FORBIDDEN]: 'You do not have permission to perform this action',
  [ErrorCodes.INVALID_TOKEN]: 'Invalid or expired authentication token',
  [ErrorCodes.VALIDATION_ERROR]: 'Invalid input data',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCodes.INVALID_INPUT]: 'Invalid input format',
  [ErrorCodes.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCodes.RECORD_NOT_FOUND]: 'Requested resource not found',
  [ErrorCodes.DUPLICATE_RECORD]: 'Resource already exists',
  [ErrorCodes.NETWORK_ERROR]: 'Network connection failed',
  [ErrorCodes.TIMEOUT]: 'Request timed out',
  [ErrorCodes.RATE_LIMITED]: 'Too many requests, please try again later',
  [ErrorCodes.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
} as const;

/**
 * Handle Supabase errors
 */
export function handleSupabaseError(error: PostgrestError): ApiError {
  console.error('Supabase error:', error);
  
  switch (error.code) {
    case 'PGRST116':
      return {
        code: ErrorCodes.RECORD_NOT_FOUND,
        message: 'Resource not found',
        statusCode: 404,
        details: error.details,
      };
    case 'PGRST204':
      return {
        code: ErrorCodes.DATABASE_ERROR,
        message: 'Database schema error',
        statusCode: 500,
        details: error.details,
      };
    case '23505': // Unique constraint violation
      return {
        code: ErrorCodes.DUPLICATE_RECORD,
        message: 'Resource already exists',
        statusCode: 409,
        details: error.details,
      };
    case '23503': // Foreign key constraint violation
      return {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid reference to related resource',
        statusCode: 400,
        details: error.details,
      };
    default:
      return {
        code: ErrorCodes.DATABASE_ERROR,
        message: 'Database operation failed',
        statusCode: 500,
        details: error,
      };
  }
}

/**
 * Handle validation errors
 */
export function handleValidationError(field: string, message: string): ApiError {
  return {
    code: ErrorCodes.VALIDATION_ERROR,
    message: `Validation error: ${field} - ${message}`,
    statusCode: 400,
    details: { field, message },
  };
}

/**
 * Handle authentication errors
 */
export function handleAuthError(type: 'unauthorized' | 'forbidden' | 'invalid_token'): ApiError {
  switch (type) {
    case 'unauthorized':
      return {
        code: ErrorCodes.UNAUTHORIZED,
        message: ErrorMessages[ErrorCodes.UNAUTHORIZED],
        statusCode: 401,
      };
    case 'forbidden':
      return {
        code: ErrorCodes.FORBIDDEN,
        message: ErrorMessages[ErrorCodes.FORBIDDEN],
        statusCode: 403,
      };
    case 'invalid_token':
      return {
        code: ErrorCodes.INVALID_TOKEN,
        message: ErrorMessages[ErrorCodes.INVALID_TOKEN],
        statusCode: 401,
      };
  }
}

/**
 * Handle network errors
 */
export function handleNetworkError(error: Error): ApiError {
  console.error('Network error:', error);
  
  if (error.name === 'AbortError') {
    return {
      code: ErrorCodes.TIMEOUT,
      message: ErrorMessages[ErrorCodes.TIMEOUT],
      statusCode: 408,
    };
  }
  
  return {
    code: ErrorCodes.NETWORK_ERROR,
    message: ErrorMessages[ErrorCodes.NETWORK_ERROR],
    statusCode: 503,
    details: error.message,
  };
}

/**
 * Create standardized API error response
 */
export function createErrorResponse(error: ApiError): NextResponse {
  const response = {
    error: error.message,
    code: error.code,
    ...(error.details && { details: error.details }),
  };
  
  return NextResponse.json(response, { status: error.statusCode });
}

/**
 * Handle unexpected errors
 */
export function handleUnexpectedError(error: unknown): NextResponse {
  console.error('Unexpected error:', error);
  
  const apiError: ApiError = {
    code: ErrorCodes.INTERNAL_ERROR,
    message: ErrorMessages[ErrorCodes.INTERNAL_ERROR],
    statusCode: 500,
    details: process.env.NODE_ENV === 'development' ? error : undefined,
  };
  
  return createErrorResponse(apiError);
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

/**
 * Input validation utilities
 */
export const Validators = {
  /**
   * Validate email format
   */
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  /**
   * Validate document title
   */
  documentTitle: (title: string): { valid: boolean; message?: string } => {
    if (!title || title.trim().length === 0) {
      return { valid: false, message: 'Title is required' };
    }
    if (title.length > 200) {
      return { valid: false, message: 'Title must be 200 characters or less' };
    }
    return { valid: true };
  },
  
  /**
   * Validate document content
   */
  documentContent: (content: string): { valid: boolean; message?: string } => {
    if (content.length > 50000) {
      return { valid: false, message: 'Content must be 50,000 characters or less' };
    }
    return { valid: true };
  },
  
  /**
   * Validate UUID format
   */
  uuid: (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  },
  
  /**
   * Validate timestamp
   */
  timestamp: (timestamp: number): boolean => {
    return timestamp > 0 && timestamp <= Date.now() + 60000; // Allow 1 minute future
  },
};

/**
 * Logging utility
 */
export class Logger {
  static error(message: string, error?: any, context?: any): void {
    console.error(`[ERROR] ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
  
  static warn(message: string, context?: any): void {
    console.warn(`[WARN] ${message}`, {
      context,
      timestamp: new Date().toISOString(),
    });
  }
  
  static info(message: string, context?: any): void {
    console.log(`[INFO] ${message}`, {
      context,
      timestamp: new Date().toISOString(),
    });
  }
}
