import { queryToParams, type DirectusClient } from '../index.js';

const SEPARATOR = '/';

const mergePaths = (a: string, b: string) => {
	if (a.endsWith(SEPARATOR)) a = a.slice(0, -1);
	if (!b.startsWith(SEPARATOR)) b = SEPARATOR + b;
	return a + b;
};

/**
 * Build URL based on provided options
 *
 * @param baseUrl The base URL
 * @param options The request options
 *
 * @returns URL
 */
export const getRequestUrl = (client: DirectusClient<any>, path: string, params?: Record<string, any>): URL => {
	const newPath = client.url.pathname === SEPARATOR ? path : mergePaths(client.url.pathname, path);
	const url = new client.globals.URL(newPath, client.url);

	if (params) {
		for (const [k, v] of Object.entries(queryToParams(params))) {
			if (v && typeof v === 'object' && !Array.isArray(v)) {
				for (const [k2, v2] of Object.entries(v)) {
					url.searchParams.set(`${k}[${k2}]`, String(v2));
				}
			} else {
				url.searchParams.set(k, v);
			}
		}
	}

	return url;
};
