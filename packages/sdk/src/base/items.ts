import { ITransport } from '../transport';
import { IItems, Item, QueryOne, QueryMany, OneItem, ManyItems, PartialItem, ItemsOptions } from '../items';
import { ID, FieldType } from '../types';

export class ItemsHandler<T extends Item> implements IItems<T> {
	protected transport: ITransport;
	protected endpoint: string;
	protected collection: string;

	constructor(collection: string, transport: ITransport) {
		this.collection = collection;
		this.transport = transport;
		this.endpoint = collection.startsWith('directus_') ? `/${collection.substring(9)}` : `/items/${collection}`;
	}

	async readOne(id: ID, query?: QueryOne<T>, options?: ItemsOptions): Promise<OneItem<T>> {
		const response = await this.transport.get<T>(`${this.endpoint}/${encodeURI(id as string)}`, {
			...options?.requestOptions,
			params: query,
		});

		return response.data as T;
	}

	async readMany(ids: ID[], query?: QueryMany<T>, options?: ItemsOptions): Promise<ManyItems<T>> {
		const collectionFields = await this.transport.get<FieldType[]>(`/fields/${this.collection}`);

		const primaryKeyField = collectionFields.data?.find((field: any) => field.schema.is_primary_key === true);

		const { data, meta } = await this.transport.get<T[]>(`${this.endpoint}`, {
			...options?.requestOptions,
			params: {
				filter: {
					[primaryKeyField!.field]: { _in: ids },
					...query?.filter,
				},
				sort: query?.sort || primaryKeyField!.field,
				...query,
			},
		});

		return {
			data,
			meta,
		};
	}

	async readByQuery(query?: QueryMany<T>, options?: ItemsOptions): Promise<ManyItems<T>> {
		const { data, meta } = await this.transport.get<T[]>(`${this.endpoint}`, {
			...options?.requestOptions,
			params: query,
		});

		return {
			data,
			meta,
		};
	}

	async createOne(item: PartialItem<T>, query?: QueryOne<T>, options?: ItemsOptions): Promise<OneItem<T>> {
		return (
			await this.transport.post<T>(`${this.endpoint}`, item, {
				...options?.requestOptions,
				params: query,
			})
		).data;
	}

	async createMany(items: PartialItem<T>[], query?: QueryMany<T>, options?: ItemsOptions): Promise<ManyItems<T>> {
		return await this.transport.post<PartialItem<T>[]>(`${this.endpoint}`, items, {
			...options?.requestOptions,
			params: query,
		});
	}

	async updateOne(id: ID, item: PartialItem<T>, query?: QueryOne<T>, options?: ItemsOptions): Promise<OneItem<T>> {
		return (
			await this.transport.patch<PartialItem<T>>(`${this.endpoint}/${encodeURI(id as string)}`, item, {
				...options?.requestOptions,
				params: query,
			})
		).data;
	}

	async updateMany(
		ids: ID[],
		data: PartialItem<T>,
		query?: QueryMany<T>,
		options?: ItemsOptions
	): Promise<ManyItems<T>> {
		return await this.transport.patch<PartialItem<T>[]>(
			`${this.endpoint}`,
			{
				keys: ids,
				data,
			},
			{
				...options?.requestOptions,
				params: query,
			}
		);
	}

	async updateByQuery(
		updateQuery: QueryMany<T>,
		data: PartialItem<T>,
		query?: QueryMany<T>,
		options?: ItemsOptions
	): Promise<ManyItems<T>> {
		return await this.transport.patch<PartialItem<T>[]>(
			`${this.endpoint}`,
			{
				query: updateQuery,
				data,
			},
			{
				...options?.requestOptions,
				params: query,
			}
		);
	}

	async deleteOne(id: ID, options?: ItemsOptions): Promise<void> {
		await this.transport.delete(`${this.endpoint}/${encodeURI(id as string)}`, undefined, options?.requestOptions);
	}

	async deleteMany(ids: ID[], options?: ItemsOptions): Promise<void> {
		await this.transport.delete(`${this.endpoint}`, ids, options?.requestOptions);
	}
}
