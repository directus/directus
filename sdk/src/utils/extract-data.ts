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
			return withErrors(result);
		}

		if (type?.startsWith('text/html') || type?.startsWith('text/plain')) {
			const result = await response.text();
			if (!response.ok) throw result;
			return withErrors(result);
		}

		// fallback for anything else
		return response;
	}

	// exception for alternatives like ofetch that don't return the Response object
	return withErrors(response);
}

function withErrors(result: any) {
	const handler = {
		get(target: any, prop: any) {
			if (prop === 'apiErrors' && 'errors' in result) {
				return result.errors;
			}

			return target[prop];
		},
	};

	return new Proxy<any>('data' in result ? result.data : result, handler);
}
