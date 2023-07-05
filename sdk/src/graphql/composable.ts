import type { DirectusClient } from '../client.js';
import type { GraphqlClient } from './types.js';
import { request } from '../utils/request.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import type { AuthenticationClient } from '../auth/types.js';

/**
 * Creates a client to communicate with Directus GraphQL.
 *
 * @returns A Directus GraphQL client.
 */
export const graphql = () => {
	return <Schema extends object>(client: DirectusClient<Schema>): GraphqlClient<Schema> => {
		return {
			async query<Output extends object = Record<string, any>>(
				query: string,
				variables?: Record<string, unknown>,
				scope: 'items' | 'system' = 'items'
			): Promise<Output> {
				const options: RequestInit = {
					method: 'POST',
					body: JSON.stringify({ query, variables }),
					headers: {},
				};

				if ('getToken' in this) {
					const token = await (this.getToken as AuthenticationClient<Schema>['getToken'])();

					if (token) {
						if (!options.headers) options.headers = {};
						options.headers = { Authorization: `Bearer ${token}` };
					}
				}

				const requestPath = scope === 'items' ? '/graphql' : '/graphql/system';
				const requestUrl = getRequestUrl(client.url, requestPath);

				return await request<Output>(requestUrl.toString(), options);
			},
		};
	};
};
