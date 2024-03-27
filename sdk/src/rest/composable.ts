import type { StaticTokenClient } from '../auth/types.js';
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
		return {
			async request<Output = any>(getOptions: RestCommand<Output, Schema>): Promise<Output> {
				const options = getOptions();

				// all api requests require this content type
				if (!options.headers) {
					options.headers = {};
				}

				if ('Content-Type' in options.headers === false) {
					options.headers['Content-Type'] = 'application/json';
				} else if (options.headers['Content-Type'] === 'multipart/form-data') {
					// let the fetch function deal with multipart boundaries
					delete options.headers['Content-Type'];
				}

				// we need to use THIS here instead of client to access overridden functions
				if ('getToken' in this) {
					const token = await (this.getToken as StaticTokenClient<Schema>['getToken'])();

					if (token) {
						if (!options.headers) options.headers = {};
						options.headers['Authorization'] = `Bearer ${token}`;
					}
				}

				const requestUrl = getRequestUrl(client.url, options.path, options.params);

				let fetchOptions: RequestInit = {
					method: options.method ?? 'GET',
					headers: options.headers ?? {},
				};

				if ('credentials' in restConfig) {
					fetchOptions.credentials = restConfig.credentials;
				}

				if (options.body) {
					fetchOptions['body'] = options.body;
				}

				// apply onRequest hook from command
				if (options.onRequest) {
					fetchOptions = await options.onRequest(fetchOptions);
				}

				// apply global onRequest hook
				if (restConfig.onRequest) {
					fetchOptions = await restConfig.onRequest(fetchOptions);
				}

				let result = await request<Output>(requestUrl.toString(), fetchOptions, client.globals.fetch);

				// apply onResponse hook from command
				if ('onResponse' in options) {
					result = await options.onResponse(result, fetchOptions);
				}

				// apply global onResponse hook
				if ('onResponse' in config) {
					result = await config.onResponse(result, fetchOptions);
				}

				return result as Output;
			},
		};
	};
};
