/**
 * Relations handler
 */
import { IItems, ManyItems, OneItem, PartialItem, QueryMany, QueryOne } from '../items';
import { ITransport } from '../transport';
import { RelationType, DefaultType, ID } from '../types';

export type RelationItem<T = DefaultType> = RelationType & T;
export class RelationsHandler<T extends RelationItem> implements IItems<T> {
	transport: ITransport;
	collection: string;

	constructor(collection: string, transport: ITransport) {
		this.transport = transport;
		this.collection = collection;
	}

	async readOne(id: ID, query?: QueryOne<T>): Promise<ManyItems<T>> {
		const response = await this.transport.get(`/relations/${this.collection}/${id}`, {
			params: query,
		});
		return response.data as T;
	}

	async readMany(query?: QueryMany<T>): Promise<ManyItems<T>> {
		const { data, meta } = await this.transport.get(`/relations/${this.collection}`, {
			params: query,
		});
		return {
			data,
			meta,
		};
	}
	async createOne(item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>> {
		return (
			await this.transport.post<T>(`/relations/${this.collection}`, item, {
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

	async deleteOne(id: ID): Promise<void> {
		await this.transport.delete(`/relations/${this.collection}/${id}`);
	}

	async deleteMany(ids: ID[]): Promise<void> {
		await this.transport.delete(`/relations/${this.collection}`, ids);
	}
}

// directus.relations(t,c)
