/**
 * Collections handler
 */

import { ManyItems, OneItem, PartialItem, QueryMany, QueryOne } from '../items';
import { ITransport } from '../transport';
import { CollectionType, DefaultType, ID } from '../types';

export type CollectionItem<T = DefaultType> = CollectionType & T;

export class CollectionsHandler<T = CollectionItem> {
	transport: ITransport;
	collection: string;
	constructor(collection: string, transport: ITransport) {
		this.collection = collection;
		this.transport = transport;
	}

	async readOne(): Promise<OneItem<T>> {
		const response = await this.transport.get(`/collections`, {
			params: this.collection,
		});

		// eslint-disable-next-line no-console
		console.log(response.data);
		return response.data as T;
	}

	async createOne(item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>> {
		return (
			await this.transport.post<T>(`/collections/`, item, {
				params: query,
			})
		).data;
	}

	async createMany(items: PartialItem<T>[], query?: QueryMany<T>): Promise<ManyItems<T>> {
		return await this.transport.post<PartialItem<T>[]>(`/collections/`, items, {
			params: query,
		});
	}

	async updateOne(id: ID, item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>> {
		return (
			await this.transport.patch<PartialItem<T>>(`/collections/${encodeURI(id as string)}`, item, {
				params: query,
			})
		).data;
	}

	async deleteOne(id: ID): Promise<void> {
		await this.transport.delete(`/collections/${this.collection}/${id}`);
	}

	async deleteMany(ids: ID[]): Promise<void> {
		await this.transport.delete(`/collections/${this.collection}`, ids);
	}
}
