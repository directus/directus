import type { DirectusClient } from '../client.js';

// export type HttpMethod = 'GET' | 'SEARCH' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// export interface RestRequestOptions {
// 	path: string;
// 	params?: Record<string, unknown>;
// 	method?: HttpMethod;
// 	headers?: Record<string, string>;
// 	body?: string;
// }

export interface GraphqlClient<Schema> {
	query: (options: any) => Promise<any>;
}

export const graphql = () => {
	return <Schema>(client: DirectusClient<Schema>): GraphqlClient<Schema> => {
		return {
			async query() {
				return 1;
			},
		};
	};
};
