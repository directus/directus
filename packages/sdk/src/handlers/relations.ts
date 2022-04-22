/**
 * Relations handler
 */
import { ManyItems, OneItem, PartialItem, EmptyParamError } from '../items';
import { ITransport } from '../transport';
import { RelationType, DefaultType, ID } from '../types';

export type RelationItem<T = DefaultType> = RelationType & T;
export class RelationsHandler<T = RelationItem> {
	transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async readOne(collection: string, id: ID): Promise<OneItem<T>> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		if (`${id}` === '') throw new EmptyParamError('id');
		const response = await this.transport.get(`/relations/${collection}/${id}`);
		return response.data as T;
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

	async createOne(item: PartialItem<T>): Promise<OneItem<T>> {
		return (await this.transport.post<T>(`/relations`, item)).data;
	}

	async updateOne(collection: string, field: string, item: PartialItem<T>): Promise<OneItem<T>> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		if (`${field}` === '') throw new EmptyParamError('field');
		return (
			await this.transport.patch<PartialItem<T>>(`/relations/${collection}/${field}`, {
				params: item,
			})
		).data;
	}

	async deleteOne(collection: string, field: string): Promise<void> {
		if (`${collection}` === '') throw new EmptyParamError('collection');
		if (`${field}` === '') throw new EmptyParamError('field');
		await this.transport.delete(`/relations/${collection}/${field}`);
	}
}
