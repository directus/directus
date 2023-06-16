import type { RequestOptions } from '../types/index.js';

export const request = async <Output extends object>(url: string, options: RequestOptions): Promise<Output> => {
	/** @TODO Check fetch implementation for all methods */
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers ?? {}),
	};

	const fetchOptions: Record<string, any> = {
		method: options.method ?? 'GET',
		headers,
	};

	if (options.body) {
		fetchOptions['body'] = options.body;
	}

	const response = await globalThis.fetch(url, fetchOptions);

	if (!response.ok) {
		/** @TODO Enhance by returning response data */
		throw new Error('Request errored');
	}

	const data = (await response.json()) as { data: Output };

	return data.data;
};
