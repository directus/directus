export const ErrorCode = {
	// HTTP status mappings
	BAD_REQUEST: 'BAD_REQUEST',
	UNAUTHORIZED: 'UNAUTHORIZED',
	FORBIDDEN: 'FORBIDDEN',
	NOT_FOUND: 'NOT_FOUND',
	UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
	RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
	INTERNAL_ERROR: 'INTERNAL_ERROR',
	SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

	// Business logic codes
	LICENSE_EXPIRED: 'LICENSE_EXPIRED',
	LICENSE_CANCELED: 'LICENSE_CANCELED',
	LICENSE_BOUND: 'LICENSE_BOUND',
	BINDING_MISMATCH: 'BINDING_MISMATCH',
	INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
	SUBSCRIPTION_PAST_DUE: 'SUBSCRIPTION_PAST_DUE',
	NO_PAYMENT_METHOD: 'NO_PAYMENT_METHOD',
	ADDON_NOT_ALLOWED: 'ADDON_NOT_ALLOWED',
	SEAT_OVERFLOW: 'SEAT_OVERFLOW',
	OPERATION_IN_PROGRESS: 'OPERATION_IN_PROGRESS',
	CACHE_STALE: 'CACHE_STALE',
	BILLING_LINKAGE_MISSING: 'BILLING_LINKAGE_MISSING',
} as const;

type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ErrorResponse {
	[key: string]: unknown;
}

export function createError(message: string, errorCode?: ErrorCode, context?: Record<string, unknown>): ErrorResponse {
	const code = errorCode ?? ErrorCode.INTERNAL_ERROR;

	return {
		errors: [
			{
				message: message,
				extensions: {
					code,
					message,
					...context,
				},
			},
		],
	};
}

export function badRequestError(message: string, context?: Record<string, unknown>): ErrorResponse {
	return createError(message, ErrorCode.BAD_REQUEST, context);
}

export function unauthorizedError(message: string, errorCode?: ErrorCode): ErrorResponse {
	return createError(message, errorCode ?? ErrorCode.UNAUTHORIZED);
}

export function paymentRequiredError(message: string, context?: Record<string, unknown>): ErrorResponse {
	return createError(message, ErrorCode.NO_PAYMENT_METHOD, context);
}

export function forbiddenError(
	message: string,
	errorCode?: ErrorCode,
	context?: Record<string, unknown>,
): ErrorResponse {
	return createError(message, errorCode ?? ErrorCode.FORBIDDEN, context);
}

export function notFoundError(message: string): ErrorResponse {
	return createError(message, ErrorCode.NOT_FOUND);
}

export function rateLimitedError(
	message: string,
	errorCode?: ErrorCode,
	context?: Record<string, unknown>,
): ErrorResponse {
	return createError(message, errorCode ?? ErrorCode.RATE_LIMIT_EXCEEDED, context);
}

export function internalServerError(message: string): ErrorResponse {
	return createError(message, ErrorCode.INTERNAL_ERROR);
}

export function serviceUnavailableError(
	message: string,
	errorCode?: ErrorCode,
	context?: Record<string, unknown>,
): ErrorResponse {
	return createError(message, errorCode ?? ErrorCode.SERVICE_UNAVAILABLE, context);
}
