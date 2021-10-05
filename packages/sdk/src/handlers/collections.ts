/**
 * Collections handler
 */

import { ManyItems, OneItem, PartialItem, QueryOne } from '../items.js';
import { ITransport } from '../transport.js';
import { CollectionType, DefaultType } from '../types.js';

export type CollectionItem<T = DefaultType> = CollectionType & T;

export class CollectionsHandler<T = CollectionItem> {
	transport: ITransport;
	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async readOne(collection: string): Promise<OneItem<T>> {
		const response = await this.transport.get(`/collections/${collection}`);
		return response.data as T;
	}

	async readAll(): Promise<ManyItems<T>> {
		const { data, meta } = await this.transport.get(`/collections`);

		return {
			data,
			meta,
		};
	}

	async createOne(collection: PartialItem<T>): Promise<OneItem<T>> {
		return (await this.transport.post<T>(`/collections`, collection)).data;
	}

	async createMany(collections: PartialItem<T>[]): Promise<ManyItems<T>> {
		const { data, meta } = await this.transport.post(`/collections`, collections);

		return {
			data,
			meta,
		};
	}

	async updateOne(collection: string, item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>> {
		return (
			await this.transport.patch<PartialItem<T>>(`/collections/${collection}`, item, {
				params: query,
			})
		).data;
	}

	async deleteOne(collection: string): Promise<void> {
		await this.transport.delete(`/collections/${collection}`);
	}
}
