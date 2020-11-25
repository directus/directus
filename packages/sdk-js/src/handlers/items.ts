import { Query, Item as BaseItem, Payload, Response, PrimaryKey } from '../types';
import { AxiosInstance } from 'axios';

export class ItemsHandler<Item extends BaseItem = BaseItem> {
	axios: AxiosInstance;
	private endpoint: string;

	constructor(collection: string, axios: AxiosInstance) {
		this.axios = axios;
		this.endpoint = collection.startsWith('directus_')
			? `/${collection.substring(9)}/`
			: `/items/${collection}/`;
	}

	async create<T = Partial<Item>>(payload: Payload, query?: Query): Promise<Response<T>>;
	async create<T = Partial<Item>>(payloads: Payload[], query?: Query): Promise<Response<T[]>>;
	async create<T = Partial<Item>>(
		payloads: Payload | Payload[],
		query?: Query
	): Promise<Response<T | T[]>> {
		const result = await this.axios.post(this.endpoint, payloads, {
			params: query,
		});

		return result.data;
	}

	async read<T extends BaseItem = Partial<Item>>(): Promise<Response<T | T[]>>;
	async read<T extends BaseItem = Partial<Item>>(
		query: Query & { single: true }
	): Promise<Response<T>>;
	async read<T extends BaseItem = Partial<Item>>(query: Query): Promise<Response<T | T[]>>;
	async read<T extends BaseItem = Partial<Item>>(
		key: PrimaryKey,
		query?: Query
	): Promise<Response<T>>;
	async read<T extends BaseItem = Partial<Item>>(
		keys: PrimaryKey[],
		query?: Query
	): Promise<Response<T | T[]>>;
	async read<T extends BaseItem = Partial<Item>>(
		keysOrQuery?: PrimaryKey | PrimaryKey[] | Query,
		query?: Query & { single: boolean }
	): Promise<Response<T | T[]>> {
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

	async update<T extends BaseItem = Item>(
		key: PrimaryKey,
		payload: Payload,
		query?: Query
	): Promise<Response<T>>;
	async update<T extends BaseItem = Item>(
		keys: PrimaryKey[],
		payload: Payload,
		query?: Query
	): Promise<Response<T[]>>;
	async update<T extends BaseItem = Item>(
		payload: Payload[],
		query?: Query
	): Promise<Response<T[]>>;
	async update<T extends BaseItem = Item>(payload: Payload, query: Query): Promise<Response<T[]>>;
	async update<T extends BaseItem = Item>(
		keyOrPayload: PrimaryKey | PrimaryKey[] | Payload | Payload[],
		payloadOrQuery?: Payload | Query,
		query?: Query
	): Promise<Response<T | T[]>> {
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
