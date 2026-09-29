import {
	ErrorCode,
	ForbiddenError,
	HitRateLimitError,
	InvalidPayloadError,
	isDirectusError,
	LicenseInvalidError,
	ServiceUnavailableError,
} from '@directus/errors';
import type { InvalidLicenseStatus, LicenseInvalidFailure } from '@directus/license';
import {
	getLicenseFailure,
	getLicenseRateLimit,
	isLicenseInvalid,
	isLicenseServerError,
	toInvalidLicenseStatus,
} from '@directus/license';
import { useLogger } from '../../logger/index.js';

const REASON_BY_FAILURE: Record<LicenseInvalidFailure, string> = {
	verification: 'The license could not be verified',
	expired: 'The license has expired',
	canceled: 'The license has been canceled',
	suspended: 'The license has been suspended',
	invalid_key: 'The license key is not valid',
	activation_limit: 'The license has reached its activation limit',
	binding_mismatch: 'The license key is bound to another project',
};

/**
 * Translate a license request failure into a directus error
 */
export function handleLicenseError(error: unknown): never {
	const failure = getLicenseFailure(error);

	useLogger().warn(error, `License request failed: ${failure}`);

	if (isLicenseInvalid(failure)) {
		throw new LicenseInvalidError({ failure, reason: REASON_BY_FAILURE[failure] });
	}

	switch (failure) {
		case 'invalid_request': {
			const reason = isLicenseServerError(error) ? error.message.replace(/\.$/, '') : '';

			throw new InvalidPayloadError({ reason: reason || 'The licensing service rejected the request' });
		}

		case 'not_permitted':
		case 'payment':
			throw new ForbiddenError();

		case 'rate_limited': {
			const { limit, retryAfter } = getLicenseRateLimit(error);

			throw new HitRateLimitError({ limit, reset: new Date(Date.now() + retryAfter * 1000) });
		}

		case 'unavailable':
			throw new ServiceUnavailableError({ service: 'license', reason: 'The licensing service could not be reached' });
	}
}

/**
 * Convert a license error to reason group
 */
export function toReason(error: unknown): InvalidLicenseStatus {
	if (isDirectusError(error, ErrorCode.LicenseInvalid)) {
		return error.extensions.failure;
	}

	return toInvalidLicenseStatus(getLicenseFailure(error));
}
