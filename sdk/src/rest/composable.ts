import type { DirectusClient } from '../client.js';
import type { RestCommand } from './types.js';
import { getRequestUrl } from './utils/get-request-url.js';

export interface RestClient<TSchema extends object> {
	request<TOptions extends object, TOutput extends object>(
		options: RestCommand<TOptions, TOutput, TSchema>
	): Promise<TOutput>;
}

export const rest = () => {
	return <TSchema extends object>(client: DirectusClient<TSchema>): RestClient<TSchema> => {
		return {
			async request<TOptions extends object, TOutput extends object>(
				getOptions: RestCommand<TOptions, TOutput, TSchema>
			): Promise<TOutput> {
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

				return data.data as TOutput;
			},
		};
	};
};
