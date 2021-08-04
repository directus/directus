/**
 * Fields handler
 */

import { ManyItems, OneItem, PartialItem, QueryMany, QueryOne } from '../items';
import { ITransport } from '../transport';
import { FieldType, DefaultType, ID } from '../types';

export type FieldItem<T = DefaultType> = FieldType & T;

export class FieldsHandler<T = FieldItem> {
	transport: ITransport;
	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async readOne(collection: string, id: ID, query?: QueryOne<T>): Promise<OneItem<T>> {
		const response = await this.transport.get(`/fields/${collection}/${id}`, {
			params: query,
		});
		return response.data as T;
	}

	async readMany(collection: string, query?: QueryMany<T>): Promise<ManyItems<T>> {
		const { data, meta } = await this.transport.get(`/fields/${collection}`, {
			params: query,
		});
		return {
			data,
			meta,
		};
	}

	async createOne(collection: string, item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>> {
		return (
			await this.transport.post<T>(`fields/${collection}`, item, {
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

	async deleteOne(collection: string, id: ID): Promise<void> {
		await this.transport.delete(`/relations/${collection}/${id}`);
	}

	async deleteMany(collection: string, ids: ID[]): Promise<void> {
		await this.transport.delete(`/relations/${collection}`, ids);
	}
}
