import type { DirectusClient } from '../client.js';
import { withoutTrailingSlash } from '../utils.js';
import type { AuthStorage } from './authentication.js';

export type GqlResult<Schema extends object, Collection extends keyof Schema> = {
	[x in Collection]: Schema[Collection][];
};

export interface GraphQLConfig {
	url?: string;
}

export interface GraphQLClientConfig {
	apiURL: string;
}

export interface GraphQLClient {
	config: GraphQLClientConfig;
	graphql<Output extends object = Record<string, any>>(
		query: string,
		variables?: Record<string, unknown>
	): Promise<Output>;
	graphqlSystem<Output extends object = Record<string, any>>(
		query: string,
		variables?: Record<string, unknown>
	): Promise<Output>;
	// graphqlSubscribe<Output extends object = Record<string, any>>(
	// 	query: string,
	// 	variables?: Record<string, unknown>
	// ): AsyncGenerator<Output, void, unknown>;
}

export function GraphQL(cfg: GraphQLConfig = {}) {
	return <Client extends DirectusClient>(client: Client) => {
		const gqlClient: GraphQLClient = {
			config: {
				apiURL: cfg.url ? withoutTrailingSlash(cfg.url) : client.config.apiURL,
			},
			async graphql(query: string, variables?: Record<string, unknown>) {
				const url = this.config.apiURL + '/graphql';

				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
				};

				if ('auth' in this) {
					const { access_token } = this.auth as AuthStorage;

					if (access_token) {
						headers['Authorization'] = `Bearer ${access_token}`;
					}
				}

				const response = await client.config.fetch(url, {
					headers,
					method: 'POST',
					body: JSON.stringify({ query, variables: variables ?? {} }),
				});

				if (!response.ok) {
					throw new Error('Request errored');
				}

				const data = await response.json();

				return data.data;
			},
			async graphqlSystem(query: string, variables?: Record<string, unknown>) {
				const url = this.config.apiURL + '/graphql/system';

				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
				};

				if ('auth' in this) {
					const { access_token } = this.auth as AuthStorage;

					if (access_token) {
						headers['Authorization'] = `Bearer ${access_token}`;
					}
				}

				const response = await client.config.fetch(url, {
					headers,
					method: 'POST',
					body: JSON.stringify({ query, variables: variables ?? {} }),
				});

				if (!response.ok) {
					throw new Error('Request errored');
				}

				const data = await response.json();

				return data.data;
			},
		};

		return gqlClient;
	};
}
