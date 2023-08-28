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
	options: RequestInit
): Promise<Output> => {
	options.headers =
		typeof options.headers === 'object' && !Array.isArray(options.headers)
			? (options.headers as Record<string, string>)
			: {};

	const response = await globalThis.fetch(url, options).catch((reason) => {
		throw { reason, response };
	});

	const data = await extractData(response).catch((reason) => {
		throw { reason, response };
	});

	return data;
};
