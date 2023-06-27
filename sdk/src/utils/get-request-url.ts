import type { RequestOptions } from '../types/index.js';

/**
 * Build URL based on provided options
 *
 * @param baseUrl The base URL
 * @param options The request options
 *
 * @returns URL
 */
export const getRequestUrl = (baseUrl: URL, options: RequestOptions): URL => {
	const url = new globalThis.URL(options.path, baseUrl);

	if (options.params) {
		for (const [k, v] of Object.entries(options.params)) {
			url.searchParams.set(k, v);
		}
	}

	return url;
};
