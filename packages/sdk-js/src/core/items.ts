//import { Query, Payload, Response } from '../types';
import { ITransport } from '../shared/transport';
import { IItems, Item, ID, Query } from '../shared/items';

export class ItemsHandler<T extends Item> implements IItems<T> {
	private transport: ITransport;
	private endpoint: string;

	constructor(collection: string, transport: ITransport) {
		this.transport = transport;
		this.endpoint = collection.startsWith('directus_') ? `/${collection.substring(9)}` : `/items/${collection}`;
	}

	async readOne(id: ID): Promise<T> {
		const response = await this.transport.get(`${this.endpoint}/${id}`);
		return response.data;
	}

	async readMany(_ids: ID[]): Promise<T[]> {
		throw new Error('Not implemented.');
	}

	async readQuery(_query: Query<T>): Promise<T[]> {
		throw new Error('Not implemented.');
	}

	async createOne(_item: Partial<T>): Promise<T> {
		throw new Error('Not implemented.');
	}

	async createMany(_items: Partial<T>[]): Promise<T[]> {
		throw new Error('Not implemented.');
	}

	async updateOne(_id: ID, _item: Partial<T>): Promise<T> {
		throw new Error('Not implemented.');
	}

	//updateMany(id: PrimaryKey[], item: Partial<T>): Promise<T>;

	async deleteOne(_id: ID): Promise<void> {
		throw new Error('Not implemented.');
	}

	async deleteMany(_id: ID[]): Promise<void> {
		throw new Error('Not implemented.');
	}

	/*
	async read(): Promise<Response<T | T[]>>;
	async read(query: Query & { single: true }): Promise<Response<T>>;
	async read(query: Query): Promise<Response<T | T[]>>;
	async read(key: PrimaryKey, query?: Query): Promise<Response<T>>;
	async read(keys: PrimaryKey[], query?: Query): Promise<Response<T | T[]>>;
	async read(
		keysOrQuery?: PrimaryKey | PrimaryKey[] | Query,
		query?: Query & { single: boolean }
	): Promise<Response<T | T[]>> {
		let keys: PrimaryKey | PrimaryKey[] | null = null;

		if (
			keysOrQuery &&
			(Array.isArray(keysOrQuery) || typeof keysOrQuery === 'string' || typeof keysOrQuery === 'number')
		) {
			keys = keysOrQuery;
		}

		let params: Query = {};

		if (query) {
			params = query;
		} else if (!query && typeof keysOrQuery === 'object' && Array.isArray(keysOrQuery) === false) {
			params = keysOrQuery as Query;
		}

		let endpoint = this._endpoint;

		if (keys) {
			endpoint += keys;
		}

		const result = await this._transport.get(endpoint, { params });

		return result.data;
	}

	async update(key: PrimaryKey, payload: Payload, query?: Query): Promise<Response<T>>;
	async update(keys: PrimaryKey[], payload: Payload, query?: Query): Promise<Response<T[]>>;
	async update(payload: Payload[], query?: Query): Promise<Response<T[]>>;
	async update(payload: Payload, query: Query): Promise<Response<T[]>>;
	async update(
		keyOrPayload: PrimaryKey | PrimaryKey[] | Payload | Payload[],
		payloadOrQuery?: Payload | Query,
		query?: Query
	): Promise<Response<T | T[]>> {
		if (
			typeof keyOrPayload === 'string' ||
			typeof keyOrPayload === 'number' ||
			(Array.isArray(keyOrPayload) && (keyOrPayload as any[]).every((key) => ['string', 'number'].includes(typeof key)))
		) {
			const key = keyOrPayload as PrimaryKey | PrimaryKey[];
			const payload = payloadOrQuery as Payload;

			const result = await this._transport.patch(`${this._endpoint}${key}`, payload, {
				params: query,
			});
			return result.data;
		} else {
			const result = await this._transport.patch(`${this._endpoint}`, keyOrPayload, {
				params: payloadOrQuery,
			});

			return result.data;
		}
	}

	async delete(key: PrimaryKey): Promise<void>;
	async delete(keys: PrimaryKey[]): Promise<void>;
	async delete(keys: PrimaryKey | PrimaryKey[]): Promise<void> {
		await this._transport.delete(`${this._endpoint}${keys}`);
	}
	*/
}
