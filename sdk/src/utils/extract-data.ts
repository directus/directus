import { isFetchResponse } from "./is-response.js";

/**
 *
 * @param {unknown} response
 * @returns {any}
 */
export async function extractData(response: unknown) {
	if (typeof response !== 'object' || !response) return;

	if (isFetchResponse(response)) {
		const res = response as Response;
		const type = res.headers.get('Content-Type')?.toLowerCase();

		if (type?.startsWith('application/json') || type?.startsWith('application/health+json')) {
			const result = await res.json();
			if (!res.ok) throw result;
			if ('data' in result) return result.data;
			return result;
		}

		if (type?.startsWith('text/html') || type?.startsWith('text/plain')) {
			const result = await res.text();
			if (!res.ok) throw result;
			return result;
		}

		// empty body fallback
		return;
	}

	// exception for alternatives like ofetch that don't return the Response object
	return 'data' in response ? response.data : response;
}
