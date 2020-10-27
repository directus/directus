import { Query, Item, Payload, Response, PrimaryKey } from '../types';
import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';

export class PresetsHandler {
	private itemsHandler: ItemsHandler;

	constructor(axios: AxiosInstance) {
		this.itemsHandler = new ItemsHandler('directus_presets', axios);
	}

	async create(payload: Payload, query?: Query): Promise<Response<Item>>;
	async create(payloads: Payload[], query?: Query): Promise<Response<Item | Item[]>>;
	async create(payloads: Payload | Payload[], query?: Query): Promise<Response<Item | Item[]>> {
		return await this.itemsHandler.create(payloads, query);
	}

	async read(query?: Query): Promise<Response<Item | Item[]>>;
	async read(key: PrimaryKey, query?: Query): Promise<Response<Item>>;
	async read(keys: PrimaryKey[], query?: Query): Promise<Response<Item | Item[]>>;
	async read(
		keysOrQuery?: PrimaryKey | PrimaryKey[] | Query,
		query?: Query & { single: boolean }
	): Promise<Response<Item | Item[]>> {
		return await this.itemsHandler.read(keysOrQuery as any, query);
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
		return await this.itemsHandler.update(
			keyOrPayload as any,
			payloadOrQuery as any,
			query as any
		);
	}

	async delete(key: PrimaryKey): Promise<void>;
	async delete(keys: PrimaryKey[]): Promise<void>;
	async delete(keys: PrimaryKey | PrimaryKey[]): Promise<void> {
		return await this.itemsHandler.delete(keys as any);
	}
}
