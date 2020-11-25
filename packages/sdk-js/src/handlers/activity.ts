import { AxiosInstance } from 'axios';
import { ItemsHandler } from './items';
import { Query, PrimaryKey, Item, Response } from '../types';

export type ActivityItem = {
	action: string;
	ip: string;
	item: PrimaryKey;
	user_agent: string;
	timestamp: string;
	id: number;
	user: string;
	comment: string | null;
	collection: string;
	revisions: [number] | null;
};

/**
 * @TODO I'm not sure why revisions return [number], but it's what api returns
 */
export class ActivityHandler {
	private axios: AxiosInstance;
	private itemsHandler: ItemsHandler<ActivityItem>;

	constructor(axios: AxiosInstance) {
		this.axios = axios;
		this.itemsHandler = new ItemsHandler<ActivityItem>('directus_activity', axios);
	}

	async read(query?: Query): Promise<Response<Partial<ActivityItem>>>;
	async read(key: PrimaryKey, query?: Query): Promise<Response<Partial<ActivityItem>>>;
	async read(
		keys: PrimaryKey[],
		query?: Query
	): Promise<Response<Partial<ActivityItem> | Partial<ActivityItem>[]>>;
	async read(
		keysOrQuery?: PrimaryKey | PrimaryKey[] | Query,
		query?: Query & { single: boolean }
	): Promise<Response<Partial<ActivityItem> | Partial<ActivityItem>[]>> {
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
