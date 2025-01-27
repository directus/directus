import type { FetchInterface } from '../index.js';
import { extractData } from './extract-data.js';

/**
 * Request helper providing default settings
 *
 * @param url The request URL
 * @param options The request options
 *
 * @returns The API result if successful
 */
export const request = async <Output = any>(
	url: string,
	options: RequestInit,
	fetcher: FetchInterface = globalThis.fetch,
): Promise<Output> => {
	options.headers =
		typeof options.headers === 'object' && !Array.isArray(options.headers)
			? (options.headers as Record<string, string>)
			: {};

	return fetcher(url, options).then((response) => {
		return extractData(response).catch((reason) => {
			const result: { response: unknown; errors: any; data?: any } = {
				errors: reason && typeof reason === 'object' && 'errors' in reason ? reason.errors : reason,
				response,
			};

			if (reason && typeof reason === 'object' && 'data' in reason) result.data = reason.data;

			return Promise.reject(result);
		});
	});
};
