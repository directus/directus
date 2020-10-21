import { Query, Item } from './types';
import { AxiosInstance } from 'axios';

export class Items {
	collection: string;
	axios: AxiosInstance;

	constructor(collection: string, axios: AxiosInstance) {
		this.collection = collection;
		this.axios = axios;
	}

	async read(query?: Query): Promise<Item[]>;
	async read(query: Query & { single: true }): Promise<Item>;
	async read(key: string | number, query?: Query): Promise<Item>;
	async read(keys: (string | number)[], query?: Query): Promise<Item[]>;
	async read(keys: (string | number)[], query: Query & { single: true }): Promise<Item>;
	async read(
		keysOrQuery?: string | number | (string | number)[] | Query,
		query?: Query & { single: boolean }
	): Promise<Item | Item[]> {
		let keys: string | number | (string | number)[] | null = null;

		if (
			keysOrQuery &&
			(Array.isArray(keysOrQuery) ||
				typeof keysOrQuery === 'string' ||
				typeof keysOrQuery === 'number')
		) {
			keys = keysOrQuery;
		}

		let params: Query = {};

		if (query) {
			params = query;
		} else if (
			!query &&
			typeof keysOrQuery === 'object' &&
			Array.isArray(keysOrQuery) === false
		) {
			params = keysOrQuery as Query;
		}

		let endpoint = `/items/`;

		if (keys) {
			endpoint += keys;
		}

		const result = await this.axios.get(endpoint, { params });

		return result.data;
	}
}
