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
	fetcher: FetchInterface = globalThis.fetch
): Promise<Output> => {
	options.headers =
		typeof options.headers === 'object' && !Array.isArray(options.headers)
			? (options.headers as Record<string, string>)
			: {};

	const response = await fetcher(url, options);

	return extractData(response).catch((reason) => {
		const errors = typeof reason === 'object' && 'errors' in reason ? reason.errors : reason;
		throw { errors, response };
	});
};
