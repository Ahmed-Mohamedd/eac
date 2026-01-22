/**
 * RFC 7807 compliant API error response interface
 */
export interface ApiError {
    /** URI reference identifying the problem type */
    type: string;

    /** Short, human-readable summary */
    title: string;

    /** HTTP status code */
    status: number;

    /** Human-readable explanation specific to this occurrence */
    detail?: string;

    /** URI reference to specific occurrence */
    instance?: string;

    /** Application-specific error code (e.g., WP-006-001) */
    errorCode?: string;

    /** Trace ID for debugging */
    traceId?: string;

    /** Timestamp when error occurred */
    timestamp?: string;
}

/**
 * Validation error response with field-specific errors
 */
export interface ValidationError extends ApiError {
    /** Dictionary of field names to their validation error messages */
    errors: Record<string, string[]>;
}
