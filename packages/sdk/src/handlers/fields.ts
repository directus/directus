/**
 * Fields handler
 */

import { ManyItems, OneItem, PartialItem } from '../items.js';
import { ITransport } from '../transport.js';
import { FieldType, DefaultType, ID } from '../types.js';

export type FieldItem<T = DefaultType> = FieldType & T;

export class FieldsHandler<T = FieldItem> {
	transport: ITransport;
	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async readOne(collection: string, id: ID): Promise<OneItem<T>> {
		const response = await this.transport.get(`/fields/${collection}/${id}`);
		return response.data as T;
	}

	async readMany(collection: string): Promise<ManyItems<T>> {
		const response = await this.transport.get(`/fields/${collection}`);
		return response.data as T;
	}

	async readAll(): Promise<ManyItems<T>> {
		const response = await this.transport.get(`/fields`);
		return response.data as T;
	}

	async createOne(collection: string, item: PartialItem<T>): Promise<OneItem<T>> {
		return (await this.transport.post<T>(`/fields/${collection}`, item)).data;
	}

	async updateOne(collection: string, field: string, item: PartialItem<T>): Promise<OneItem<T>> {
		return (await this.transport.patch<PartialItem<T>>(`/fields/${collection}/${field}`, item)).data;
	}

	async deleteOne(collection: string, field: string): Promise<void> {
		await this.transport.delete(`/fields/${collection}/${field}`);
	}
}
