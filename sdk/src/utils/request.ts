import type { RequestOptions } from '../types/index.js';

function defaultTransform(options: RequestOptions) {
	const fetchOptions: RequestInit = {
		method: options.method ?? 'GET',
		headers: options.headers ?? {},
	};

	if (options.body) {
		fetchOptions['body'] = options.body;
	}

	return fetchOptions;
}

/**
 * Request helper providing default settings
 *
 * @param url The request URL
 * @param options The request options
 *
 * @returns The API result if successful
 */
export const request = async (url: string, options: RequestOptions): Promise<Response> => {
	const fetchOptions: RequestInit = options.transformRequest
		? await options.transformRequest(options)
		: defaultTransform(options);

	return globalThis.fetch(url, fetchOptions);
};
