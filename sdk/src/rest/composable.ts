import type { DirectusClient } from '../client.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import { request } from '../utils/request.js';
import type { RestClient, RestCommand } from './types.js';

/**
 * Creates a client to communicate with the Directus REST API.
 *
 * @returns A Directus REST client.
 */
export const rest = () => {
	return <Schema extends object>(client: DirectusClient<Schema>): RestClient<Schema> => {
		return {
			async request<Output extends object>(getOptions: RestCommand<Output, Schema>): Promise<Output> {
				const options = getOptions();

				// we need to use THIS here instead of client allow for overridden functions
				const self = this as RestClient<Schema> & DirectusClient<Schema>;
				const token = await self.getToken();

				if (token) {
					if (!options.headers) options.headers = {};
					options.headers['Authorization'] = `Bearer ${token}`;
				}

				const requestUrl = getRequestUrl(client.url, options);

				return await request<Output>(requestUrl.toString(), options);
			},
		};
	};
};
