import type { DirectusClient } from '../client.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import { request } from '../utils/request.js';
import type { RestCommand } from './types.js';

/** @TODO use real REST settings */
export interface RestConfig {
	globalHeaders?: Record<string, string>;
	forceSearch?: boolean;
}

export interface RestClient<Schema extends object> {
	request<Output extends object>(options: RestCommand<Output, Schema>): Promise<Output>;
}

export const rest = (_options: RestConfig = {}) => {
	return <Schema extends object>(client: DirectusClient<Schema>): RestClient<Schema> => {
		return {
			async request<Output extends object>(getOptions: RestCommand<Output, Schema>): Promise<Output> {
				const options = getOptions();

				if (client.auth.token) {
					if (!options.headers) options.headers = {};
					options.headers['Authorization'] = `Bearer ${client.auth.token}`;
				}

				const requestUrl = getRequestUrl(client.url, options);

				return await request<Output>(requestUrl.toString(), options);
			},
		};
	};
};
