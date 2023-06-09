import type { DirectusClient } from '../client.js';

export interface GraphQLConfig {
	url?: string;
}

export interface GraphQLClientConfig {
	apiURL?: string;
	gqlURL: string;
}

export interface GraphQLClient {
	config: GraphQLClientConfig;
	graphql(query: string): any;
}

export function GraphQL(cfg: GraphQLConfig) {
	return <Client extends DirectusClient>(client: Client) => {
		const gqlClient: GraphQLClient = {
			config: {
				apiURL: cfg.url ?? client.config['apiURL']!,
				gqlURL: cfg.url ?? `${client.config['apiURL']!}/graphql`,
			},
			graphql(query) {
				// console.log(`graphql(${query})`);
			},
		};

		return gqlClient;
	};
}
