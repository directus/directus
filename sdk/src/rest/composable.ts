import type { DirectusClient } from '../client.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import { request } from '../utils/request.js';
import type { RestClient, RestCommand } from './types.js';

// export interface RestConfig {
// 	useSearch?: boolean; // use SEARCH instead of GET
// }

export const rest = (/*_options: RestConfig = {}*/) => {
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
