import type { FetchInterface } from '../index.js';
import { parseResponse } from './parse-response.js';

// type Request

/**
 * Request helper providing default settings
 *
 * @param url The request URL
 * @param options The request options
 *
 * @returns The API result if successful
 */
export const request = <Output = any>(
	url: string,
	options: RequestInit,
	fetcher: FetchInterface = globalThis.fetch,
): Promise<Output> => {
	options.headers =
		typeof options.headers === 'object' && !Array.isArray(options.headers)
			? (options.headers as Record<string, string>)
			: {};

	return fetcher(url, options)
		.then((response) => parseResponse(response).catch((reason) => {
			const errors = typeof reason === 'object' && 'errors' in reason ? reason.errors : reason;
			return Promise.reject({ errors, response });
		}));
};
