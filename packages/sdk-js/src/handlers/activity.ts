import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';
import { Query, PrimaryKey, Item, Response } from '../types';

export class ActivityHandler {
	private axios: AxiosInstance;
	private itemsHandler: ItemsHandler;

	constructor(axios: AxiosInstance) {
		this.axios = axios;
		this.itemsHandler = new ItemsHandler('directus_activity', axios);
	}

	async read<T extends Item>(query?: Query): Promise<Response<T | T[]>>;
	async read<T extends Item>(key: PrimaryKey, query?: Query): Promise<Response<T>>;
	async read<T extends Item>(keys: PrimaryKey[], query?: Query): Promise<Response<T | T[]>>;
	async read<T extends Item>(
		keysOrQuery?: PrimaryKey | PrimaryKey[] | Query,
		query?: Query & { single: boolean }
	): Promise<Response<T | T[]>> {
		const result = await this.itemsHandler.read<T>(keysOrQuery as any, query as any);
		return result;
	}

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
