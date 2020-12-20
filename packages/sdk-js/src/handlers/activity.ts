import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';
import { Query, PrimaryKey, Item, Response, OneQuery } from '../types';

export class ActivityHandler {
	private axios: AxiosInstance;
	private itemsHandler: ItemsHandler;

	constructor(axios: AxiosInstance) {
		this.axios = axios;
		this.itemsHandler = new ItemsHandler('directus_activity', axios);
	}

	readOne<T extends Item>(key?: PrimaryKey, query?: OneQuery): Promise<Response<T>>;
	readOne<T extends Item>(query?: OneQuery): Promise<Response<T>>;
	async readOne<T extends Item>(keyOrQuery?: PrimaryKey | OneQuery, query?: OneQuery): Promise<Response<T>> {
		return this.itemsHandler.readOne(keyOrQuery as any, query);
	}

	readMany<T extends Item>(query?: Query): Promise<Response<T>>;
	readMany<T extends Item>(ids: PrimaryKey[], query?: Query): Promise<Response<T>>;
	async readMany<T extends Item>(keysOrQuery?: Query | PrimaryKey[], query?: Query): Promise<Response<T[]>> {
		return this.itemsHandler.readMany(keysOrQuery as any, query);
	}
	// async read<T extends Item>(query?: Query): Promise<Response<T | T[]>>;
	// async read<T extends Item>(key: PrimaryKey, query?: Query): Promise<Response<T>>;
	// async read<T extends Item>(keys: PrimaryKey[], query?: Query): Promise<Response<T | T[]>>;
	// async read<T extends Item>(
	// 	keysOrQuery?: PrimaryKey | PrimaryKey[] | Query,
	// 	query?: Query & { single: boolean }
	// ): Promise<Response<T | T[]>> {
	// 	const result = await this.itemsHandler.read<T>(keysOrQuery as any, query as any);
	// 	return result;
	// }

	comments = {
		create: async (payload: { collection: string; item: string; comment: string }): Promise<Response<Item>> => {
			const response = await this.axios.post('/activity/comments', payload);
			return response.data;
		},
		update: async (key: PrimaryKey, payload: { comment: string }): Promise<{ data: Item | null }> => {
			const response = await this.axios.patch(`/activity/comments/${key}`, payload);
			return response.data;
		},
		delete: async (key: PrimaryKey): Promise<void> => {
			await this.axios.delete(`/activity/comments/${key}`);
		},
	};
}
