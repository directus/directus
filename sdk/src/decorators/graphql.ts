import type { DirectusClient } from '../client.js';

export interface GraphQLClient {
	gql: {
		path?: string;
	};
	graphql(query: string): any;
}

export function withGraphQL(_cfg: GraphQLClient['gql']) {
	return <S extends object, F extends object>(client: DirectusClient<S, F>) => {
		const gqlClient: GraphQLClient = {
			gql: _cfg,
			graphql(query) {
				console.log(`graphql(${query})`);
			},
		};

		return {
			...client,
			...gqlClient,
		} as DirectusClient<S, F & GraphQLClient>;
	};
}
