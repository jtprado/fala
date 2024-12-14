import { PostgrestError } from '@supabase/supabase-js';

// Error types
export type AppError = {
  code: string;
  message: string;
  details?: unknown;
  originalError?: unknown;
};

// Error codes
export const ErrorCode = {
  // Database errors
  DB_CONNECTION: 'DB_CONNECTION',
  DB_QUERY: 'DB_QUERY',
  DB_CONSTRAINT: 'DB_CONSTRAINT',
  
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  
  // Validation errors
  VALIDATION: 'VALIDATION',
  
  // General errors
  UNKNOWN: 'UNKNOWN',
} as const;

// Error messages
const ErrorMessage = {
  [ErrorCode.DB_CONNECTION]: 'Database connection error',
  [ErrorCode.DB_QUERY]: 'Database query error',
  [ErrorCode.DB_CONSTRAINT]: 'Database constraint violation',
  [ErrorCode.AUTH_REQUIRED]: 'Authentication required',
  [ErrorCode.AUTH_INVALID]: 'Invalid authentication',
  [ErrorCode.VALIDATION]: 'Validation error',
  [ErrorCode.UNKNOWN]: 'An unexpected error occurred',
} as const;

// Helper to determine if an error is a Postgrest error
function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

// Helper to determine if an error is a validation error
function isValidationError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ZodError';
}

// Main error handler
export function handleError(error: unknown): AppError {
  console.error('Error occurred:', error);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Detailed error:', error);
  }

  // Handle Supabase Postgrest errors
  if (isPostgrestError(error)) {
    switch (error.code) {
      case '42P01': // undefined_table
      case '42P02': // undefined_parameter
        return {
          code: ErrorCode.DB_QUERY,
          message: ErrorMessage[ErrorCode.DB_QUERY],
          details: error.message,
          originalError: error
        };
      case '23505': // unique_violation
      case '23503': // foreign_key_violation
        return {
          code: ErrorCode.DB_CONSTRAINT,
          message: ErrorMessage[ErrorCode.DB_CONSTRAINT],
          details: error.message,
          originalError: error
        };
      default:
        return {
          code: ErrorCode.DB_QUERY,
          message: ErrorMessage[ErrorCode.DB_QUERY],
          details: error.message,
          originalError: error
        };
    }
  }

  // Handle validation errors
  if (isValidationError(error)) {
    return {
      code: ErrorCode.VALIDATION,
      message: ErrorMessage[ErrorCode.VALIDATION],
      details: error,
      originalError: error
    };
  }

  // Handle authentication errors
  if (error instanceof Error && error.message.includes('auth')) {
    if (error.message.includes('not authenticated')) {
      return {
        code: ErrorCode.AUTH_REQUIRED,
        message: ErrorMessage[ErrorCode.AUTH_REQUIRED],
        originalError: error
      };
    }
    return {
      code: ErrorCode.AUTH_INVALID,
      message: ErrorMessage[ErrorCode.AUTH_INVALID],
      originalError: error
    };
  }

  // Default unknown error
  return {
    code: ErrorCode.UNKNOWN,
    message: ErrorMessage[ErrorCode.UNKNOWN],
    originalError: error
  };
}

// Helper to get user-friendly error message
export function getUserFriendlyErrorMessage(error: AppError): string {
  switch (error.code) {
    case ErrorCode.DB_CONNECTION:
      return 'Unable to connect to the server. Please try again later.';
    case ErrorCode.DB_QUERY:
      return 'There was an error processing your request. Please try again.';
    case ErrorCode.DB_CONSTRAINT:
      return 'This action cannot be completed due to data constraints.';
    case ErrorCode.AUTH_REQUIRED:
      return 'Please sign in to continue.';
    case ErrorCode.AUTH_INVALID:
      return 'Your session has expired. Please sign in again.';
    case ErrorCode.VALIDATION:
      return 'Please check your input and try again.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
}
