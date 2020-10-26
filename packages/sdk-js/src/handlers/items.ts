import { Query, Item, Payload, Response, PrimaryKey } from '../types';
import { AxiosInstance } from 'axios';

export class ItemsHandler {
	private axios: AxiosInstance;
	private endpoint: string;

	constructor(collection: string, axios: AxiosInstance) {
		this.axios = axios;
		this.endpoint = collection.startsWith('directus_')
			? `/${collection.substring(9)}/`
			: `/items/${collection}/`;
	}

	/**
	 * Create a single new item
	 */
	async create(payload: Payload, query?: Query): Promise<Response<Item>>;
	/**
	 * Create multiple new items at once
	 */
	async create(payloads: Payload[], query?: Query): Promise<Response<Item | Item[]>>;
	async create(payloads: Payload | Payload[], query?: Query): Promise<Response<Item | Item[]>> {
		const result = await this.axios.post(this.endpoint, payloads, {
			params: query,
		});

		return result.data;
	}

	async read(query?: Query): Promise<Response<Item | Item[]>>;
	async read(key: PrimaryKey, query?: Query): Promise<Response<Item>>;
	async read(keys: PrimaryKey[], query?: Query): Promise<Response<Item | Item[]>>;
	async read(
		keysOrQuery?: PrimaryKey | PrimaryKey[] | Query,
		query?: Query & { single: boolean }
	): Promise<Response<Item | Item[]>> {
		let keys: PrimaryKey | PrimaryKey[] | null = null;

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

		let endpoint = this.endpoint;

		if (keys) {
			endpoint += keys;
		}

		const result = await this.axios.get(endpoint, { params });

		return result.data;
	}

	async update(key: PrimaryKey, payload: Payload, query?: Query): Promise<Response<Item>>;
	async update(keys: PrimaryKey[], payload: Payload, query?: Query): Promise<Response<Item[]>>;
	async update(payload: Payload[], query?: Query): Promise<Response<Item[]>>;
	async update(payload: Payload, query: Query): Promise<Response<Item[]>>;
	async update(
		keyOrPayload: PrimaryKey | PrimaryKey[] | Payload | Payload[],
		payloadOrQuery?: Payload | Query,
		query?: Query
	): Promise<Response<Item | Item[]>> {
		if (
			typeof keyOrPayload === 'string' ||
			typeof keyOrPayload === 'number' ||
			(Array.isArray(keyOrPayload) &&
				(keyOrPayload as any[]).every((key) => ['string', 'number'].includes(typeof key)))
		) {
			const key = keyOrPayload as PrimaryKey | PrimaryKey[];
			const payload = payloadOrQuery as Payload;

			const result = await this.axios.patch(`${this.endpoint}${key}`, payload, {
				params: query,
			});
			return result.data;
		} else {
			const result = await this.axios.patch(`${this.endpoint}`, keyOrPayload, {
				params: payloadOrQuery,
			});

			return result.data;
		}
	}

	async delete(key: PrimaryKey): Promise<void>;
	async delete(keys: PrimaryKey[]): Promise<void>;
	async delete(keys: PrimaryKey | PrimaryKey[]): Promise<void> {
		await this.axios.delete(`${this.endpoint}${keys}`);
	}
}
