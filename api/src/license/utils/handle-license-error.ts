import {
	ForbiddenError,
	HitRateLimitError,
	InvalidPayloadError,
	LicenseInvalidError,
	ServiceUnavailableError,
} from '@directus/errors';
import { LicenseServerError } from '@directus/license';

export function handleLicenseError(error: unknown): never {
	if (error instanceof LicenseServerError) {
		const reason = error.message;

		switch (error.code) {
			case 'INVALID_PAYLOAD':
			case 'LIMIT_OVERFLOW':
				throw new InvalidPayloadError({ reason });
			case 'INVALID_CREDENTIALS':
			case 'LICENSE_EXPIRED':
			case 'LICENSE_CANCELED':
			case 'LICENSE_SUSPENDED':
			case 'NOT_FOUND':
				throw new LicenseInvalidError();
			case 'FORBIDDEN':
			case 'BINDING_MISMATCH':
			case 'SUBSCRIPTION_PAST_DUE':
			case 'NO_PAYMENT_METHOD':
			case 'ACTIVATION_LIMIT_EXCEEDED':
			case 'ADDON_NOT_ALLOWED':
			case 'ROUTE_NOT_FOUND':
			case 'BILLING_LINKAGE_MISSING':
				throw new ForbiddenError({ reason });

			case 'REQUESTS_EXCEEDED': {
				const limit = typeof error.extensions['limit'] === 'number' ? error.extensions['limit'] : 0;

				const retryAfterSeconds =
					typeof error.extensions['retry_after'] === 'number' ? error.extensions['retry_after'] : 1;

				throw new HitRateLimitError({
					limit,
					reset: new Date(Date.now() + retryAfterSeconds * 1000),
				});
			}
		}
	}

	throw new ServiceUnavailableError({
		service: 'license',
		reason: error instanceof Error ? error.message : 'An unknown error occurred',
	});
}
