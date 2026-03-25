import type { RequestError } from '@/api';
import { translateAPIError } from '@/lang';

/**
 * Returns a user-facing error message from an API error response.
 * Prefers the specific `extensions.reason` if provided by the API,
 * otherwise falls back to translating the error code via i18n.
 */
export function getErrorReason(error: RequestError): string {
	const reason = error?.response?.data?.errors?.[0]?.extensions?.reason;
	if (reason) return reason;
	return translateAPIError(error);
}
