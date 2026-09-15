import {
	ErrorCode,
	ForbiddenError,
	HitRateLimitError,
	InvalidPayloadError,
	isDirectusError,
	LicenseInvalidError,
	LicenseServiceUnavailableError,
} from '@directus/errors';
import type { InvalidLicenseStatus, LicenseRequestFailure } from '@directus/license';
import { LicenseServerError } from '@directus/license';

type Failure = InvalidLicenseStatus | LicenseRequestFailure;

/**
 * The license server's error codes, grouped by the fail type
 */
const FAILURE_BY_CODE: Record<string, Failure> = {
	// The license is invalid
	LICENSE_EXPIRED: 'expired',
	LICENSE_CANCELED: 'canceled',
	LICENSE_SUSPENDED: 'suspended',

	// The key is not one this instance can use or has changed
	INVALID_CREDENTIALS: 'invalid_key',
	NOT_FOUND: 'invalid_key',
	INVALID_PAYLOAD: 'invalid_key',
	ACTIVATION_LIMIT_EXCEEDED: 'activation_limit',
	BINDING_MISMATCH: 'binding_mismatch',

	LIMIT_OVERFLOW: 'invalid_request',
	FORBIDDEN: 'not_permitted',
	SUBSCRIPTION_PAST_DUE: 'not_permitted',
	NO_PAYMENT_METHOD: 'not_permitted',
	BILLING_LINKAGE_MISSING: 'not_permitted',
	ADDON_NOT_ALLOWED: 'not_permitted',
	REQUESTS_EXCEEDED: 'rate_limited',
};

/**
 * Convert a license error code -> failure type
 */
function toFailure(error: unknown): Failure {
	if (error instanceof LicenseServerError === false) return 'unavailable';

	return FAILURE_BY_CODE[error.code] ?? 'unavailable';
}

/**
 * Whether the license itself is invalid (e.g. ended via expired, no longer binding etc)
 */
export function isLicenseInvalid(failure: Failure): failure is Exclude<InvalidLicenseStatus, LicenseRequestFailure> {
	const invalid: readonly Failure[] = [
		'verification',
		'expired',
		'canceled',
		'suspended',
		'invalid_key',
		'activation_limit',
		'binding_mismatch',
	];

	return invalid.includes(failure);
}

/**
 * Whether the license is inactive (e.g. expired, canceled etc)
 */
export function isLicenseInactive(failure: Failure): boolean {
	const blocked: readonly Failure[] = ['expired', 'canceled', 'suspended'];

	return blocked.includes(failure);
}

/**
 * Translate a license failure into a directus error
 */
export function handleLicenseError(error: unknown): never {
	const reason = error instanceof Error ? error.message : 'An unknown error occurred';
	const failure = toFailure(error);

	if (isLicenseInvalid(failure)) {
		throw new LicenseInvalidError({ failure, reason });
	}

	switch (failure) {
		case 'invalid_request':
			throw new InvalidPayloadError({ reason });

		case 'not_permitted':
			throw new ForbiddenError({ reason });

		case 'rate_limited': {
			const extensions = error instanceof LicenseServerError ? error.extensions : {};
			const retryAfter = typeof extensions['retry_after'] === 'number' ? extensions['retry_after'] : 1;

			throw new HitRateLimitError({
				limit: typeof extensions['limit'] === 'number' ? extensions['limit'] : 0,
				reset: new Date(Date.now() + retryAfter * 1000),
			});
		}

		case 'unavailable':
			throw new LicenseServiceUnavailableError({ reason });
	}
}

/**
 * Convert a license error to its failure group/type
 */
export function toReason(error: unknown): InvalidLicenseStatus {
	if (isDirectusError(error, ErrorCode.LicenseInvalid)) {
		return error.extensions.failure;
	}

	const failure = toFailure(error);

	return isLicenseInvalid(failure) ? failure : 'unavailable';
}
