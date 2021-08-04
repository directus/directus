/**
 * Relations handler
 */
import { ManyItems, OneItem, PartialItem, QueryMany, QueryOne } from '../items';
import { ITransport } from '../transport';
import { RelationType, DefaultType, ID } from '../types';

export type RelationItem<T = DefaultType> = RelationType & T;
export class RelationsHandler<T = RelationItem> {
	transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async readOne(collection: string, id: ID, query?: QueryOne<T>): Promise<OneItem<T>> {
		const response = await this.transport.get(`/relations/${collection}/${id}`, {
			params: query,
		});
		return response.data as T;
	}

	async readMany(collection: string, query?: QueryMany<T>): Promise<ManyItems<T>> {
		const { data, meta } = await this.transport.get(`/relations/${collection}`, {
			params: query,
		});
		return {
			data,
			meta,
		};
	}
	async createOne(item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>> {
		return (
			await this.transport.post<T>(`/relations/`, item, {
				params: query,
			})
		).data;
	}

	async createMany(items: PartialItem<T>[], query?: QueryMany<T>): Promise<ManyItems<T>> {
		return await this.transport.post<PartialItem<T>[]>(`/relations}`, items, {
			params: query,
		});
	}

	async updateOne(id: ID, item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>> {
		return (
			await this.transport.patch<PartialItem<T>>(`/relations/${encodeURI(id as string)}`, item, {
				params: query,
			})
		).data;
	}

	async updateMany(ids: ID[], data: PartialItem<T>, query?: QueryMany<T>): Promise<ManyItems<T>> {
		return await this.transport.patch<PartialItem<T>[]>(
			`relations`,
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

// directus.relations(t,c)
