/**
 * Relations handler
 */
import { ManyItems, OneItem, ItemInput, EmptyParamError, Item } from '../items';
import { ITransport } from '../transport';
import { RelationType, DefaultType, ID } from '../types';

export type RelationItem<T = DefaultType> = RelationType & T;
export class RelationsHandler<T extends Item = RelationItem> {
	transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async readOne(collection: string, id: ID): Promise<OneItem<T>> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		if (`${id}` === '') throw new EmptyParamError('id');
		const response = await this.transport.get(`/relations/${collection}/${id}`);
		return response.data as OneItem<T>;
	}

	async readMany(collection: string): Promise<ManyItems<T>> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		const response = await this.transport.get(`/relations/${collection}`);
		return response.data;
	}

	async readAll(): Promise<ManyItems<T>> {
		const response = await this.transport.get(`/relations`);
		return response.data;
	}

	async createOne(item: ItemInput<T>): Promise<OneItem<T>> {
		return (await this.transport.post<OneItem<T>>(`/relations`, item)).data;
	}

	async updateOne(collection: string, field: string, item: ItemInput<T>): Promise<OneItem<T>> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		if (`${field}` === '') throw new EmptyParamError('field');
		return (await this.transport.patch<OneItem<T>>(`/relations/${collection}/${field}`, item)).data;
	}

	async deleteOne(collection: string, field: string): Promise<void> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		if (`${field}` === '') throw new EmptyParamError('field');
		await this.transport.delete(`/relations/${collection}/${field}`);
	}
}
