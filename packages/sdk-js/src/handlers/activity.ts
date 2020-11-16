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

	async read(query?: Query): Promise<Response<Item | Item[]>>;
	async read(key: PrimaryKey, query?: Query): Promise<Response<Item>>;
	async read(keys: PrimaryKey[], query?: Query): Promise<Response<Item | Item[]>>;
	async read(
		keysOrQuery?: PrimaryKey | PrimaryKey[] | Query,
		query?: Query & { single: boolean }
	): Promise<Response<Item | Item[]>> {
		const result = await this.itemsHandler.read(keysOrQuery as any, query as any);
		return result;
	}

	comments = {
		create: async (payload: {
			collection: string;
			item: string;
			comment: string;
		}): Promise<Response<Item>> => {
			const response = await this.axios.post('/activity/comments', payload);
			return response.data;
		},
		update: async (key: PrimaryKey, payload: { comment: string }) => {
			const response = await this.axios.patch(`/activity/comments/${key}`, payload);
			return response.data;
		},
		delete: async (key: PrimaryKey) => {
			await this.axios.delete(`/activity/comments/${key}`);
		},
	};
}
