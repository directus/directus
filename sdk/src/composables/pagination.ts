import type { DirectusClient } from '../client/index.js';

export interface PaginationConfig {
	pageSize?: number;
}

export interface PaginationClientConfig {
	pageSize: number;
}

export interface PaginationClient {
	config: PaginationClientConfig;
	paginate(test: string): any;
}

export function Pagination(_cfg: PaginationConfig = {}) {
	return <Client extends DirectusClient>(_client: Client) => {
		const paginateClient: PaginationClient = {
			config: {
				pageSize: _cfg.pageSize ?? 100,
			},
			paginate(test) {
				// console.log(`graphql(${query})`);
			},
		};

		return paginateClient;
	};
}
