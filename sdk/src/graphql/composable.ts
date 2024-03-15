import type { DirectusClient } from '../types/client.js';
import type { GraphqlClient, GraphqlConfig } from './types.js';
import { request } from '../utils/request.js';
import { getRequestUrl } from '../utils/get-request-url.js';
import type { AuthenticationClient } from '../auth/types.js';
import type { RequestConfig } from '../index.js';

const defaultConfigValues: GraphqlConfig = {};

/**
 * Creates a client to communicate with Directus GraphQL.
 *
 * @returns A Directus GraphQL client.
 */
export const graphql = (config: Partial<GraphqlConfig> = {}) => {
	return <Schema extends object>(client: DirectusClient<Schema>): GraphqlClient<Schema> => {
		const gqlConfig = { ...defaultConfigValues, ...config };
		return {
			async query<Output extends object = Record<string, any>>(
				query: string,
				variables?: Record<string, unknown>,
				scope: 'items' | 'system' = 'items',
			): Promise<Output> {
				const requestPath = scope === 'items' ? '/graphql' : '/graphql/system';

				const fetchOptions: RequestConfig = {
					url: getRequestUrl(client, requestPath),
					method: 'POST',
					body: JSON.stringify({ query, variables }),
					headers: {},
				};

				if ('credentials' in gqlConfig) {
					fetchOptions.credentials = gqlConfig.credentials;
				}

				if ('getToken' in this) {
					const token = await (this.getToken as AuthenticationClient<Schema>['getToken'])();

					if (token) {
						fetchOptions.headers['Authorization'] = `Bearer ${token}`;
					}
				}

				if ('Content-Type' in fetchOptions.headers === false) {
					fetchOptions.headers['Content-Type'] = 'application/json';
				}

				return await request<Output>(fetchOptions, client.globals.fetch, client.hooks);
			},
		};
	};
};
