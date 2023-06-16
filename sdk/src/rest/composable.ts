import type { DirectusClient } from '../client.js';
import type { RestCommand } from '../types/index.js';
import { fetchRequest } from '../utils/request.js';
import { getRequestUrl } from '../utils/get-request-url.js';

/** @TODO use real REST settings */
export interface RestConfig {
	globalHeaders?: Record<string, string>;
	forceSearch?: boolean;
}

export interface RestClient<Schema extends object> {
	request<Options extends object, Output extends object>(
		options: RestCommand<Options, Output, Schema>
	): Promise<Output>;
}

export const rest = (_options: RestConfig = {}) => {
	return <Schema extends object>(client: DirectusClient<Schema>): RestClient<Schema> => {
		return {
			async request<Options extends object, Output extends object>(
				getOptions: RestCommand<Options, Output, Schema>
			): Promise<Output> {
				const options = getOptions();

				if (client.auth.token) {
					if (!options.headers) options.headers = {};
					options.headers['Authorization'] = `Bearer ${client.auth.token}`;
				}

				const requestUrl = getRequestUrl(client.url, options);

				return await fetchRequest<Output>(requestUrl.toString(), options);
			},
		};
	};
};
