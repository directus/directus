/**
 * Fields handler
 */

import { ManyItems, OneItem, PartialItem, QueryMany, QueryOne } from '../items';
import { ITransport } from '../transport';
import { FieldType, DefaultType, ID } from '../types';

export type FieldItem<T = DefaultType> = FieldType & T;

export class FieldsHandler<T = DefaultType> {
	transport: ITransport;
	collection: string;

	constructor(collection: string, transport: ITransport) {
		this.transport = transport;
		this.collection = collection;
	}

	async readOne(id: ID, query?: QueryOne<T>): Promise<ManyItems<T>> {
		const response = await this.transport.get(`/fields/${this.collection}/${id}`, {
			params: query,
		});
		return response.data as T;
	}

	async readMany(query?: QueryMany<T>): Promise<ManyItems<T>> {
		const { data, meta } = await this.transport.get(`/fields/${this.collection}`, {
			params: query,
		});
		return {
			data,
			meta,
		};
	}

	async createOne(item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>> {
		return (
			await this.transport.post<T>(`fields/${this.collection}`, item, {
				params: query,
			})
		).data;
	}

	async updateOne(id: ID, item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>> {
		return (
			await this.transport.patch<PartialItem<T>>(`fields/${encodeURI(id as string)}`, item, {
				params: query,
			})
		).data;
	}

	async updateMany(ids: ID[], data: PartialItem<T>, query?: QueryMany<T>): Promise<ManyItems<T>> {
		return await this.transport.patch<PartialItem<T>[]>(
			`fields`,
			{
				keys: ids,
				data,
			},
			{
				params: query,
			}
		);
	}

	async deleteOne(id: ID): Promise<void> {
		await this.transport.delete(`/relations/${this.collection}/${id}`);
	}

	async deleteMany(ids: ID[]): Promise<void> {
		await this.transport.delete(`/relations/${this.collection}`, ids);
	}
}
