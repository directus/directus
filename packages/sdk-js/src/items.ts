import { Query, Item, Payload, Response } from './types';
import { AxiosInstance } from 'axios';

export class Items {
	collection: string;
	axios: AxiosInstance;

	constructor(collection: string, axios: AxiosInstance) {
		this.collection = collection;
		this.axios = axios;
	}

	async create(payload: Payload, query?: Query): Promise<Response<Item>>;
	async create(payloads: Payload[], query?: Query): Promise<Response<Item | Item[]>>;
	async create(payloads: Payload | Payload[], query?: Query): Promise<Response<Item | Item[]>> {
		const result = await this.axios.post(`/items/${this.collection}/`, payloads, {
			params: query,
		});
		return result.data;
	}

	async read(query?: Query): Promise<Response<Item | Item[]>>;
	async read(key: string | number, query?: Query): Promise<Response<Item>>;
	async read(keys: (string | number)[], query?: Query): Promise<Response<Item | Item[]>>;
	async read(
		keysOrQuery?: string | number | (string | number)[] | Query,
		query?: Query & { single: boolean }
	): Promise<Response<Item | Item[]>> {
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

		let endpoint = `/items/${this.collection}/`;

		if (keys) {
			endpoint += keys;
		}

		const result = await this.axios.get(endpoint, { params });

		return result.data;
	}
}
