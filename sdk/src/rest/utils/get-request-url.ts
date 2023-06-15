import type { RestRequestOptions } from '../types.js';

export const getRequestUrl = (baseUrl: URL, options: RestRequestOptions): URL => {
	const url = new globalThis.URL(options.path, baseUrl);

	if (options.params) {
		for (const [k, v] of Object.entries(options.params)) {
			url.searchParams.set(k, v);
		}
	}

	return url;
};
