/**
 * Collections handler
 */

import { ManyItems, OneItem, ItemInput, QueryOne, EmptyParamError } from '../items';
import { ITransport } from '../transport';
import { CollectionType, DefaultType } from '../types';

export type CollectionItem<T = DefaultType> = CollectionType & T;

export class CollectionsHandler<T = CollectionItem> {
	transport: ITransport;
	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async readOne(collection: string): Promise<OneItem<NonNullable<T>>> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		const response = await this.transport.get(`/collections/${collection}`);
		return response.data as OneItem<NonNullable<T>>;
	}

	async readAll(): Promise<ManyItems<NonNullable<T>>> {
		const { data, meta } = await this.transport.get(`/collections`);

		return {
			data,
			meta,
		};
	}

	async createOne(collection: ItemInput<T>): Promise<OneItem<NonNullable<T>>> {
		return (await this.transport.post<OneItem<NonNullable<T>>>(`/collections`, collection)).data;
	}

	async createMany(collections: ItemInput<T>[]): Promise<ManyItems<NonNullable<T>>> {
		const { data, meta } = await this.transport.post(`/collections`, collections);

		return {
			data,
			meta,
		};
	}

	async updateOne(collection: string, item: ItemInput<T>, query?: QueryOne<T>): Promise<OneItem<NonNullable<T>>> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		return (
			await this.transport.patch<OneItem<NonNullable<T>>>(`/collections/${collection}`, item, {
				params: query,
			})
		).data;
	}

	async deleteOne(collection: string): Promise<void> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		await this.transport.delete(`/collections/${collection}`);
	}
}
