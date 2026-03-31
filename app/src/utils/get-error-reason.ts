import type { RequestError } from '@/api';
import { translateAPIError } from '@/lang';

/**
 * Extract the most descriptive error message from an API error response.
 * Prefers `extensions.reason` (from InvalidPayloadError etc.) when available,
 * falls back to `translateAPIError()` for generic error code translation.
 */
export function getErrorReason(error: RequestError): string {
	const reason = error?.response?.data?.errors?.[0]?.extensions?.reason;

	if (reason && typeof reason === 'string') {
		return reason;
	}

	return translateAPIError(error);
}
