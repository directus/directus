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

	readOne<T extends Item>(key?: PrimaryKey, query?: OneQuery): Promise<Response<T>>;
	readOne<T extends Item>(query?: OneQuery): Promise<Response<T>>;
	async readOne<T extends Item>(keyOrQuery?: PrimaryKey | OneQuery, query?: OneQuery): Promise<Response<T>> {
		let endpoint = this.endpoint;
		let params: Query = {};

		if (typeof keyOrQuery === 'string' || typeof keyOrQuery === 'number') {
			endpoint += keyOrQuery;
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

	// There is no support in the API for this signature
	// updateOne<T extends Item>(payload: Payload, query: OneQuery): Promise<Response<T>>;
	updateOne<T extends Item>(payload: Payload, key: PrimaryKey, query?: OneQuery): Promise<Response<T>>;
	async updateOne<T extends Item>(payload: Payload, keys: PrimaryKey, query?: OneQuery): Promise<Response<T>> {
		const result = await this.axios.patch(`${this.endpoint}${keys}`, payload, { params: query });
		return result.data;
	}

	// There is no support in the API for this signature
	// Uncomment parts of codes that are not needed for now when it's added to API
	// https://github.com/directus/directus/blob/9f58589a43c6bd66e5248fe536429cc1bf020445/api/src/controllers/items.ts#L130
	// updateMany<T extends Item>(payload: Payload, query?: Query): Promise<Response<T[]>>;
	updateMany<T extends Item>(payload: Payload, keys: PrimaryKey[], query?: Query): Promise<Response<T[]>>;
	updateMany<T extends Item>(payload: Payload[], query?: Query): Promise<Response<T[]>>;
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
		// if (Array.isArray(keysOrQuery)) {
		const result = await this.axios.patch(`${this.endpoint}${keysOrQuery}`, payload, {
			params: query,
		});
		return result.data;
		// }

		// const result = await this.axios.patch(this.endpoint, payload, {
		// 	params: query,
		// });
		// return result.data;
	}

	async deleteOne(key: PrimaryKey): Promise<void> {
		await this.axios.delete(`${this.endpoint}${key}`);
	}

	async deleteMany(keys: PrimaryKey[]): Promise<void> {
		await this.axios.delete(`${this.endpoint}${keys}`);
	}
}
