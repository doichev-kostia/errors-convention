import type { ValueOf } from "../types.js";

export const ErrorCode = {
	// The client specified an invalid argument regardless of the state of the system.
	INVALID_ARGUMENT: 'INVALID_ARGUMENT',
	// The operation was rejected because the system is not in a state required for the operation's execution.
	// For example, the directory to be deleted is non-empty, an rmdir operation is applied to a non-directory, etc.
	FAILED_PRECONDITION: 'FAILED_PRECONDITION',
	// The requested entity was not found.
	NOT_FOUND: 'NOT_FOUND',
	// The entity that a client tried to create already exists.
	ALREADY_EXISTS: 'ALREADY_EXISTS',
	// The caller does not have valid authentication credentials for the operation.
	UNAUTHENTICATED: 'UNAUTHENTICATED',
	// The caller does not have permission to execute the specified operation.
	PERMISSION_DENIED: 'PERMISSION_DENIED',
	// The caller has exhausted their rate limit or quota
	TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
	// The part of the underlying system is broken
	INTERNAL: 'INTERNAL',
	// When the application doesn't know how to handle the caught error
	UNKNOWN: 'UNKNOWN',
	// The service is currently unavailable. Can be retried with a backoff.
	UNAVAILABLE: 'UNAVAILABLE',
} as const;

export const HTTP_STATUS_CODE: Record<ValueOf<typeof ErrorCode>, number> = {
	INVALID_ARGUMENT: 400,
	FAILED_PRECONDITION: 400,
	NOT_FOUND: 404,
	ALREADY_EXISTS: 409,
	UNAUTHENTICATED: 401,
	PERMISSION_DENIED: 403,
	TOO_MANY_REQUESTS: 429,
	INTERNAL: 500,
	UNKNOWN: 500,
	UNAVAILABLE: 503,
};
