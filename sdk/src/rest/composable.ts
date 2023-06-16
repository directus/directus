import type { DirectusClient } from '../client.js';
import type { RestCommand } from './types.js';
import { getRequestUrl } from './utils/get-request-url.js';

export interface RestClient<Schema extends object> {
	request<Options extends object, Output extends object>(
		options: RestCommand<Options, Output, Schema>
	): Promise<Output>;
}

export const rest = () => {
	return <Schema extends object>(client: DirectusClient<Schema>): RestClient<Schema> => {
		return {
			async request<Options extends object, Output extends object>(
				getOptions: RestCommand<Options, Output, Schema>
			): Promise<Output> {
				const options = getOptions();

				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
					...(options.headers ?? {}),
				};

				if (client.auth.token) {
					headers['Authorization'] = `Bearer ${client.auth.token}`;
				}

				const requestUrl = getRequestUrl(client.config.url, options);

				const response = await globalThis.fetch(requestUrl, {
					method: options.method,
				});

				if (!response.ok) {
					/** @TODO Enhance by returning response data */
					throw new Error('Request errored');
				}

				const data = (await response.json()) as { data: unknown };

				return data.data as Output;
			},
		};
	};
};
