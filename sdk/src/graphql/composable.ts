import type { DirectusClient } from '../client.js';
import type { RequestOptions } from '../types/request.js';
import { fetchRequest } from '../utils/request.js';
import { getRequestUrl } from '../utils/get-request-url.js';

/** @TODO check required GraphQL settings */
// export interface GraphQLConfig {
// 	url?: string;
// }

export interface GraphqlClient<_Schema extends object> {
	query<Output extends object = Record<string, any>>(
		query: string,
		variables?: Record<string, unknown>,
		scope?: 'items' | 'system'
	): Promise<Output>;
}

export const graphql = () => {
	return <Schema extends object>(client: DirectusClient<Schema>): GraphqlClient<Schema> => {
		return {
			async query<Output extends object = Record<string, any>>(
				query: string,
				variables?: Record<string, unknown>,
				scope?: 'items' | 'system'
			): Promise<Output> {
				const options: RequestOptions = {
					method: 'POST',
					path: scope === 'items' ? '/graphql' : '/graphql/system',
					body: JSON.stringify({ query, variables }),
					headers: {},
				};

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
