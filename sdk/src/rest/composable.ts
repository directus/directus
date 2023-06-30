import type { DirectusClient } from '../client.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import { request } from '../utils/request.js';
import type { RestClient, RestCommand, RestConfig } from './types.js';
import { extractJsonData } from './utils/extract-json-data.js';

/**
 * Creates a client to communicate with the Directus REST API.
 *
 * @returns A Directus REST client.
 */
export const rest = (_config: RestConfig = {}) => {
	return <Schema extends object>(client: DirectusClient<Schema>): RestClient<Schema> => {
		return {
			async request<Output = any>(getOptions: RestCommand<Output, Schema>): Promise<Output> {
				const options = getOptions();

				if (!options.headers?.['Content-Type']) {
					if (!options.headers) options.headers = {};
					options.headers['Content-Type'] = 'application/json';
				}

				if (!options.transformResponse) {
					options.transformResponse = extractJsonData;
				}

				// we need to use THIS here instead of client allow for overridden functions
				const self = this as RestClient<Schema> & DirectusClient<Schema>;
				const token = await self.getToken();

				if (token) {
					if (!options.headers) options.headers = {};
					options.headers['Authorization'] = `Bearer ${token}`;
				}

				const requestUrl = getRequestUrl(client.url, options);

				return request(requestUrl.toString(), options)
					.then(options.transformResponse);
			},
		};
	};
};
