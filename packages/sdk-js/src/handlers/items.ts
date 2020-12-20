import { Query, Item, Payload, Response, PrimaryKey, OneQuery } from '../types';
import { AxiosInstance } from 'axios';

export class ItemsHandler {
	axios: AxiosInstance;
	private endpoint: string;

	constructor(collection: string, axios: AxiosInstance) {
		this.axios = axios;
		this.endpoint = collection.startsWith('directus_') ? `/${collection.substring(9)}/` : `/items/${collection}/`;
	}

	async createOne<T extends Item>(payload: Payload, query?: OneQuery): Promise<Response<T>> {
		const result = await this.axios.post(this.endpoint, payload, {
			params: query,
		});

		return result.data;
	}

	async createMany<T extends Item>(payloads: Payload[], query?: Query): Promise<Response<T[]>> {
		const result = await this.axios.post(this.endpoint, payloads, {
			params: query,
		});

		return result.data;
	}

	// async create<T extends Item>(payload: Payload, query?: Query): Promise<Response<T>>;
	// async create<T extends Item>(payloads: Payload[], query?: Query): Promise<Response<T[]>>;
	// async create<T extends Item>(payloads: Payload | Payload[], query?: Query): Promise<Response<T | T[]>> {
	// 	const result = await this.axios.post(this.endpoint, payloads, {
	// 		params: query,
	// 	});

	// 	return result.data;
	// }

	readOne<T extends Item>(key?: PrimaryKey, query?: OneQuery): Promise<Response<T>>;
	readOne<T extends Item>(query?: OneQuery): Promise<Response<T>>;
	async readOne<T extends Item>(keyOrQuery?: PrimaryKey | OneQuery, query?: OneQuery): Promise<Response<T>> {
		let endpoint = this.endpoint;
		let params: Query = {};

		if (typeof keyOrQuery === 'string' || typeof keyOrQuery === 'number') {
			endpoint = this.endpoint + keyOrQuery;
			if (query) {
				params = query;
			}
		} else if (keyOrQuery !== undefined) {
			params = keyOrQuery;
		}

		params.single = true;

		const response = await this.axios.get(endpoint, { params });
		return response.data;
	}

	readMany<T extends Item>(query?: Query): Promise<Response<T>>;
	readMany<T extends Item>(ids: PrimaryKey[], query?: Query): Promise<Response<T>>;
	async readMany<T extends Item>(keysOrQuery?: Query | PrimaryKey[], query?: Query): Promise<Response<T[]>> {
		if (Array.isArray(keysOrQuery)) {
			const result = await this.axios.get(`${this.endpoint}${keysOrQuery}`, {
				params: { ...(query ?? {}), single: false },
			});
			return result.data;
		} else {
			const result = await this.axios.get(this.endpoint, { params: { ...(keysOrQuery ?? {}), single: false } });
			return result.data;
		}
	}

	// async read<T extends Item>(): Promise<Response<T | T[]>>;
	// async read<T extends Item>(query: Query & { single: true }): Promise<Response<T>>;
	// async read<T extends Item>(query: Query): Promise<Response<T | T[]>>;
	// async read<T extends Item>(key: PrimaryKey, query?: Query): Promise<Response<T>>;
	// async read<T extends Item>(keys: PrimaryKey[], query?: Query): Promise<Response<T | T[]>>;
	// async read<T extends Item>(
	// 	keysOrQuery?: PrimaryKey | PrimaryKey[] | Query,
	// 	query?: Query & { single: boolean }
	// ): Promise<Response<T | T[]>> {
	// 	let keys: PrimaryKey | PrimaryKey[] | null = null;

	// 	if (
	// 		keysOrQuery &&
	// 		(Array.isArray(keysOrQuery) || typeof keysOrQuery === 'string' || typeof keysOrQuery === 'number')
	// 	) {
	// 		keys = keysOrQuery;
	// 	}

	// 	let params: Query = {};

	// 	if (query) {
	// 		params = query;
	// 	} else if (!query && typeof keysOrQuery === 'object' && Array.isArray(keysOrQuery) === false) {
	// 		params = keysOrQuery as Query;
	// 	}

	// 	let endpoint = this.endpoint;

	// 	if (keys) {
	// 		endpoint += keys;
	// 	}

	// 	const result = await this.axios.get(endpoint, { params });

	// 	return result.data;
	// }
	updateOne<T extends Item>(payload: Payload, key: PrimaryKey, query?: OneQuery): Promise<Response<T>>;
	updateOne<T extends Item>(payload: Payload, query: OneQuery): Promise<Response<T>>;
	async updateOne<T extends Item>(
		payload: Payload,
		keyOrQuery: PrimaryKey | OneQuery,
		query?: OneQuery
	): Promise<Response<T>> {
		if (typeof keyOrQuery === 'string' || typeof keyOrQuery === 'number') {
			const result = await this.axios.patch(`${this.endpoint}${keyOrQuery}`, payload, { params: query });
			return result.data;
		} else {
			const result = await this.axios.patch(`${this.endpoint}`, payload, {
				params: keyOrQuery,
			});
			return result.data;
		}
	}

	updateMany<T extends Item>(payload: Payload, keys: PrimaryKey[], query?: Query): Promise<Response<T[]>>;
	updateMany<T extends Item>(payload: Payload[], query?: Query): Promise<Response<T[]>>;
	updateMany<T extends Item>(payload: Payload, query?: Query): Promise<Response<T[]>>;
	async updateMany<T extends Item>(
		payload: Payload | Payload[],
		keysOrQuery?: PrimaryKey[] | Query,
		query?: Query
	): Promise<Response<T[]>> {
		if (Array.isArray(payload)) {
			const result = await this.axios.patch(`${this.endpoint}`, payload, {
				params: keysOrQuery,
			});
			return result.data;
		}
		if (Array.isArray(keysOrQuery)) {
			const result = await this.axios.patch(`${this.endpoint}${keysOrQuery}`, payload, {
				params: query,
			});
			return result.data;
		}

		const result = await this.axios.patch(this.endpoint, payload, {
			params: query,
		});
		return result.data;
	}

	// async update<T extends Item>(key: PrimaryKey, payload: Payload, query?: Query): Promise<Response<T>>;
	// async update<T extends Item>(keys: PrimaryKey[], payload: Payload, query?: Query): Promise<Response<T[]>>;
	// async update<T extends Item>(payload: Payload[], query?: Query): Promise<Response<T[]>>;
	// async update<T extends Item>(payload: Payload, query: Query): Promise<Response<T[]>>;
	// async update<T extends Item>(
	// 	keyOrPayload: PrimaryKey | PrimaryKey[] | Payload | Payload[],
	// 	payloadOrQuery?: Payload | Query,
	// 	query?: Query
	// ): Promise<Response<T | T[]>> {
	// 	if (
	// 		typeof keyOrPayload === 'string' ||
	// 		typeof keyOrPayload === 'number' ||
	// 		(Array.isArray(keyOrPayload) && (keyOrPayload as any[]).every((key) => ['string', 'number'].includes(typeof key)))
	// 	) {
	// 		const key = keyOrPayload as PrimaryKey | PrimaryKey[];
	// 		const payload = payloadOrQuery as Payload;

	// 		const result = await this.axios.patch(`${this.endpoint}${key}`, payload, {
	// 			params: query,
	// 		});
	// 		return result.data;
	// 	} else {
	// 		const result = await this.axios.patch(`${this.endpoint}`, keyOrPayload, {
	// 			params: payloadOrQuery,
	// 		});

	// 		return result.data;
	// 	}
	// }

	async deleteOne(key: PrimaryKey): Promise<void> {
		await this.axios.delete(`${this.endpoint}${key}`);
	}

	async deleteMany(keys: PrimaryKey[]): Promise<void> {
		await this.axios.delete(`${this.endpoint}${keys}`);
	}

	// async delete(key: PrimaryKey): Promise<void>;
	// async delete(keys: PrimaryKey[]): Promise<void>;
	// async delete(keys: PrimaryKey | PrimaryKey[]): Promise<void> {
	// 	await this.axios.delete(`${this.endpoint}${keys}`);
	// }
}
