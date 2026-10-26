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

/** Translate a license server error into a Directus error, returning any other error as is */
export function translateLicenseError(error: unknown): unknown {
	if (!isLicenseServerError(error)) return error;

	const failure = getLicenseFailure(error);

	useLogger().warn(error, `License request failed: ${failure}`);

	if (isLicenseInvalid(failure)) {
		return new LicenseInvalidError({ failure, reason: REASON_BY_FAILURE[failure] });
	}

	switch (failure) {
		case 'invalid_request':
			return new InvalidPayloadError({
				reason: error.message.replace(/\.$/, '') || 'The licensing service rejected the request',
			});

		case 'not_permitted':
		case 'payment':
			return new ForbiddenError();

		case 'rate_limited': {
			const { limit, retryAfter } = getLicenseRateLimit(error);

			return new HitRateLimitError({ limit, reset: new Date(Date.now() + retryAfter * 1000) });
		}

		case 'unavailable':
			return new ServiceUnavailableError({ service: 'license', reason: 'The licensing service could not be reached' });
	}
}

/** Whether the stored key has no activation to carry over */
export function isActivationMissing(error: unknown): boolean {
	if (!isLicenseServerError(error)) return false;

	return getLicenseFailure(error) === 'invalid_key' || isLicenseServerError(error, 'BINDING_MISMATCH');
}

/** Convert a license error to its invalid reason */
export function toReason(error: unknown): InvalidLicenseStatus {
	if (isDirectusError(error, ErrorCode.LicenseInvalid)) {
		return error.extensions.failure;
	}

	return toInvalidLicenseStatus(getLicenseFailure(error));
}
