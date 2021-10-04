import { ITransport } from '@/src/transport.js';
import { IItems, Item, QueryOne, QueryMany, OneItem, ManyItems, PartialItem } from '@/src/items.js';
import { ID } from '@/src/types.js';

export class ItemsHandler<T extends Item> implements IItems<T> {
	protected transport: ITransport;
	protected endpoint: string;

	constructor(collection: string, transport: ITransport) {
		this.transport = transport;
		this.endpoint = collection.startsWith('directus_') ? `/${collection.substring(9)}` : `/items/${collection}`;
	}

	async readOne(id: ID, query?: QueryOne<T>): Promise<OneItem<T>> {
		const response = await this.transport.get<T>(`${this.endpoint}/${encodeURI(id as string)}`, {
			params: query,
		});

		return response.data as T;
	}

	async readMany(query?: QueryMany<T>): Promise<ManyItems<T>> {
		const { data, meta } = await this.transport.get<T[]>(`${this.endpoint}`, {
			params: query,
		});

		return {
			data,
			meta,
		};
	}

	async createOne(item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>> {
		return (
			await this.transport.post<T>(`${this.endpoint}`, item, {
				params: query,
			})
		).data;
	}

	async createMany(items: PartialItem<T>[], query?: QueryMany<T>): Promise<ManyItems<T>> {
		return await this.transport.post<PartialItem<T>[]>(`${this.endpoint}`, items, {
			params: query,
		});
	}

	async updateOne(id: ID, item: PartialItem<T>, query?: QueryOne<T>): Promise<OneItem<T>> {
		return (
			await this.transport.patch<PartialItem<T>>(`${this.endpoint}/${encodeURI(id as string)}`, item, {
				params: query,
			})
		).data;
	}

	async updateMany(ids: ID[], data: PartialItem<T>, query?: QueryMany<T>): Promise<ManyItems<T>> {
		return await this.transport.patch<PartialItem<T>[]>(
			`${this.endpoint}`,
			{
				keys: ids,
				data,
			},
			{
				params: query,
			}
		);
	}

	async updateByQuery(updateQuery: QueryMany<T>, data: PartialItem<T>, query?: QueryMany<T>): Promise<ManyItems<T>> {
		return await this.transport.patch<PartialItem<T>[]>(
			`${this.endpoint}`,
			{
				query: updateQuery,
				data,
			},
			{
				params: query,
			}
		);
	}

	async deleteOne(id: ID): Promise<void> {
		await this.transport.delete(`${this.endpoint}/${encodeURI(id as string)}`);
	}

	async deleteMany(ids: ID[]): Promise<void> {
		await this.transport.delete(`${this.endpoint}`, ids);
	}
}
