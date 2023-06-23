import type { DirectusClient } from '../client.js';
import type { RequestOptions } from '../types/request.js';
import type { GraphqlClient } from './types.js';
import { request } from '../utils/request.js';

export const graphql = () => {
	return <Schema extends object>(client: DirectusClient<Schema>): GraphqlClient<Schema> => {
		return {
			async query<Output extends object = Record<string, any>>(
				query: string,
				variables?: Record<string, unknown>,
				scope: 'items' | 'system' = 'items'
			): Promise<Output> {
				const options: RequestOptions = {
					method: 'POST',
					path: scope === 'items' ? '/graphql' : '/graphql/system',
					body: JSON.stringify({ query, variables }),
					headers: {},
				};

				if (client.token) {
					if (!options.headers) options.headers = {};
					options.headers['Authorization'] = `Bearer ${client.token}`;
				}

				return await request<Output>(client.url, options);
			},
		};
	};
};
