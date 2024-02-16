import type { FetchInterface, RequestConfig, RequestHooksList } from '../index.js';
import { extractData } from './extract-data.js';

/**
 * Request helper providing default settings
 *
 * @param config The request options
 * @param fetcher The `fetch` function
 * @param hooks The callbacks
 *
 * @returns The API result if successful
 */
export async function request<Output = any>(
	config: RequestConfig,
	fetcher: FetchInterface,
	hooks: RequestHooksList,
): Promise<Output> {
	try {
		const cfg = await runRequestHooks(hooks, config);
		const { url, ...options } = cfg;

		const response = await fetcher(url.toString(), options);

		const data = await extractData(response);

		const output = await runResponseHooks(hooks, data, cfg);

		return output as Output;
	} catch (err) {
		const errors = err && typeof err === 'object' && 'errors' in err ? err.errors : err;

		if (hooks.onError.length > 0) {
			for (const hook of hooks.onError) {
				hook(errors, config);
			}
		}

		throw errors;
	}
}

async function runRequestHooks(hooks: RequestHooksList, config: RequestConfig) {
	if (hooks.onRequest.length === 0) return config;

	for (const hook of hooks.onRequest) {
		config = await hook(config);
	}

	return config;
}

async function runResponseHooks(hooks: RequestHooksList, data: any, request: RequestConfig) {
	if (hooks.onResponse.length === 0) return data;

	for (const hook of hooks.onResponse) {
		data = await hook(data, request);
	}

	return data;
}
