import type { StaticTokenClient } from '../auth/types.js';
import type { RequestConfig, RequestHooksList } from '../index.js';
import type { DirectusClient } from '../types/client.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import { request } from '../utils/request.js';
import type { RestClient, RestCommand, RestConfig } from './types.js';

const defaultConfigValues: RestConfig = {};

/**
 * Creates a client to communicate with the Directus REST API.
 *
 * @returns A Directus REST client.
 */
export const rest = (config: Partial<RestConfig> = {}) => {
	return <Schema extends object>(client: DirectusClient<Schema>): RestClient<Schema> => {
		const restConfig = { ...defaultConfigValues, ...config };

		if (config.onRequest) client.hooks.onRequest.push(config.onRequest);
		if (config.onResponse) client.hooks.onResponse.push(config.onResponse);
		if (config.onError) client.hooks.onError.push(config.onError);

		return {
			async request<Output = any>(getOptions: RestCommand<Output, Schema>): Promise<Output> {
				const options = getOptions();

				const fetchOptions: RequestConfig = {
					url: getRequestUrl(client, options.path, options.params),
					method: options.method ?? 'GET',
					headers: options.headers ?? {},
				};

				if ('Content-Type' in fetchOptions.headers === false) {
					fetchOptions.headers['Content-Type'] = 'application/json';
				} else if (fetchOptions.headers['Content-Type'] === 'multipart/form-data') {
					// let the fetch function deal with multipart boundaries
					delete fetchOptions.headers['Content-Type'];
				}

				// we need to use THIS here instead of client to access overridden functions
				if ('getToken' in this) {
					const token = await (this.getToken as StaticTokenClient<Schema>['getToken'])();

					if (token) {
						fetchOptions.headers['Authorization'] = `Bearer ${token}`;
					}
				}

				if ('credentials' in restConfig) {
					fetchOptions.credentials = restConfig.credentials;
				}

				if (options.body) {
					fetchOptions['body'] = options.body;
				}

				const hooks = cloneHooks(client.hooks);

				if (options.onRequest) hooks.onRequest.push(options.onRequest);
				if (options.onResponse) hooks.onResponse.push(options.onResponse);
				if (options.onError) hooks.onError.push(options.onError);

				const result = await request<Output>(fetchOptions, client.globals.fetch, hooks);

				return result as Output;
			},
		};
	};
};

function cloneHooks(hooks: RequestHooksList): RequestHooksList {
	return {
		onRequest: [...hooks.onRequest],
		onResponse: [...hooks.onResponse],
		onError: [...hooks.onError],
	};
}
