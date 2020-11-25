import { Query, Item, Payload, ItemsResponse, PrimaryKey } from '../types';
import { AxiosInstance } from 'axios';

export class ItemsHandler<T extends Item = Item> {
	axios: AxiosInstance;
	private endpoint: string;

	constructor(collection: string, axios: AxiosInstance) {
		this.axios = axios;
		this.endpoint = collection.startsWith('directus_')
			? `/${collection.substring(9)}/`
			: `/items/${collection}/`;
	}

	async create(payload: Payload, query?: Query): Promise<ItemsResponse<T>>;
	async create(payloads: Payload[], query?: Query): Promise<ItemsResponse<T[]>>;
	async create(payloads: Payload | Payload[], query?: Query): Promise<ItemsResponse<T | T[]>> {
		const result = await this.axios.post(this.endpoint, payloads, {
			params: query,
		});

		return result.data;
	}

	async read(): Promise<ItemsResponse<T | T[]>>;
	async read(query: Query & { single: true }): Promise<ItemsResponse<T>>;
	async read(query: Query & { single: false | undefined }): Promise<ItemsResponse<T[]>>;
	async read(key: PrimaryKey, query?: Query): Promise<ItemsResponse<T>>;
	async read(keys: PrimaryKey[], query?: Query): Promise<ItemsResponse<T | T[]>>;
	async read(
		keysOrQuery?: PrimaryKey | PrimaryKey[] | Query,
		query?: Query & { single: boolean }
	): Promise<ItemsResponse<T | T[]>> {
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

	async update(key: PrimaryKey, payload: Payload, query?: Query): Promise<ItemsResponse<T>>;
	async update(keys: PrimaryKey[], payload: Payload, query?: Query): Promise<ItemsResponse<T[]>>;
	async update(payload: Payload[], query?: Query): Promise<ItemsResponse<T[]>>;
	async update(payload: Payload, query: Query): Promise<ItemsResponse<T[]>>;
	async update(
		keyOrPayload: PrimaryKey | PrimaryKey[] | Payload | Payload[],
		payloadOrQuery?: Payload | Query,
		query?: Query
	): Promise<ItemsResponse<T | T[]>> {
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
