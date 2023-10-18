import { isFetchResponse } from './is-response.js';

/**
 * Tries to extract a fetch response
 */
export async function extractData(response: unknown) {
	if (typeof response !== 'object' || !response) return;

	if (isFetchResponse(response)) {
		const type = response.headers.get('Content-Type')?.toLowerCase();

		if (type?.startsWith('application/json') || type?.startsWith('application/health+json')) {
			const result = await response.json();
			if (!response.ok) throw result;
			if ('data' in result) return result.data;
			return result;
		}

		if (type?.startsWith('text/html') || type?.startsWith('text/plain')) {
			const result = await response.text();
			if (!response.ok) throw result;
			return result;
		}

		// fallback for anything else
		return response;
	}

	// exception for alternatives like ofetch that don't return the Response object
	return 'data' in response ? response.data : response;
}
