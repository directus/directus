import type { DirectusClient } from '../client.js';

// export type HttpMethod = 'GET' | 'SEARCH' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// export interface RestRequestOptions {
// 	path: string;
// 	params?: Record<string, unknown>;
// 	method?: HttpMethod;
// 	headers?: Record<string, string>;
// 	body?: string;
// }

export interface RestClient<Schema> {
	request: (options: any) => Promise<any>;
}

export const rest = () => {
	return <TSchema>(client: DirectusClient<TSchema>): RestClient<TSchema> => {
		return {
			async request() {
				return 1;
			},
		};
	};
};
