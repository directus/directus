import { isFetchResponse } from './is-response.js';

/**
 * Tries to parse a fetch response
 */
export async function parseResponse(response: unknown) {
	if (typeof response !== 'object' || !response) return;

	if (isFetchResponse(response)) {
		const type = response.headers.get('Content-Type')?.toLowerCase();

		if (type?.startsWith('application/json') || type?.startsWith('application/health+json')) {
			const result = await response.json();
			if (!response.ok) throw result;
			return result;
		}

		if (type?.startsWith('text/html') || type?.startsWith('text/plain')) {
			const result = await response.text();
			if (!response.ok) throw result;
			return result;
		}
	}

	return response;
}
