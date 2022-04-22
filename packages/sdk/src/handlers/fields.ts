/**
 * Fields handler
 */

import { ManyItems, OneItem, PartialItem, EmptyParamError } from '../items';
import { ITransport } from '../transport';
import { FieldType, DefaultType, ID } from '../types';

export type FieldItem<T = DefaultType> = FieldType & T;

export class FieldsHandler<T = FieldItem> {
	transport: ITransport;
	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async readOne(collection: string, id: ID): Promise<OneItem<T>> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		if (`${id}` === '') throw new EmptyParamError('id');
		const response = await this.transport.get(`/fields/${collection}/${id}`);
		return response.data as T;
	}

	async readMany(collection: string): Promise<ManyItems<T>> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		const response = await this.transport.get(`/fields/${collection}`);
		return response.data as T;
	}

	async readAll(): Promise<ManyItems<T>> {
		const response = await this.transport.get(`/fields`);
		return response.data as T;
	}

	async createOne(collection: string, item: PartialItem<T>): Promise<OneItem<T>> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		return (await this.transport.post<T>(`/fields/${collection}`, item)).data;
	}

	async updateOne(collection: string, field: string, item: PartialItem<T>): Promise<OneItem<T>> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		if (`${field}` === '') throw new EmptyParamError('field');
		return (await this.transport.patch<PartialItem<T>>(`/fields/${collection}/${field}`, item)).data;
	}

	async deleteOne(collection: string, field: string): Promise<void> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		if (`${field}` === '') throw new EmptyParamError('field');
		await this.transport.delete(`/fields/${collection}/${field}`);
	}
}
