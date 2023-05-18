import { ITransport } from '../transport';
import {
	IItems,
	Item,
	QueryOne,
	QueryMany,
	OneItem,
	ManyItems,
	ItemInput,
	ItemsOptions,
	EmptyParamError,
} from '../items';
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

	async readOne<Q extends QueryOne<T>>(id: ID, query?: Q, options?: ItemsOptions): Promise<OneItem<T, Q>> {
		if (`${id}` === '') throw new EmptyParamError('id');

		const response = await this.transport.get<OneItem<T, Q>>(`${this.endpoint}/${encodeURI(id as string)}`, {
			params: query,
			...options?.requestOptions,
		});

		return response.data!;
	}

	async readMany<Q extends QueryMany<T>>(ids: ID[], query?: Q, options?: ItemsOptions): Promise<ManyItems<T, Q>> {
		const collectionFields = await this.transport.get<FieldType[]>(`/fields/${this.collection}`);

		const primaryKeyField = collectionFields.data?.find((field: any) => field.schema.is_primary_key === true);

		const { data, meta } = await this.transport.get<NonNullable<OneItem<T, Q>>[]>(`${this.endpoint}`, {
			params: {
				...query,
				filter: {
					[primaryKeyField!.field]: { _in: ids },
					...query?.filter,
				},
				sort: query?.sort || primaryKeyField!.field,
			},
			...options?.requestOptions,
		});

		return {
			data,
			...(meta && { meta }),
		};
	}

	async readByQuery<Q extends QueryMany<T>>(query?: Q, options?: ItemsOptions): Promise<ManyItems<T, Q>> {
		const { data, meta } = await this.transport.get<NonNullable<OneItem<T, Q>>[]>(`${this.endpoint}`, {
			params: query,
			...options?.requestOptions,
		});

		return {
			data,
			...(meta && { meta }),
		};
	}

	async createOne<Q extends QueryOne<T>>(
		item: ItemInput<T>,
		query?: Q,
		options?: ItemsOptions
	): Promise<OneItem<T, Q>> {
		return (
			await this.transport.post<OneItem<T, Q>>(`${this.endpoint}`, item, {
				params: query,
				...options?.requestOptions,
			})
		).data;
	}

	async createMany<Q extends QueryMany<T>>(
		items: ItemInput<T>[],
		query?: Q,
		options?: ItemsOptions
	): Promise<ManyItems<T, Q>> {
		return await this.transport.post<NonNullable<OneItem<T, Q>>[]>(`${this.endpoint}`, items, {
			params: query,
			...options?.requestOptions,
		});
	}

	async updateOne<Q extends QueryOne<T>>(
		id: ID,
		item: ItemInput<T>,
		query?: Q,
		options?: ItemsOptions
	): Promise<OneItem<T, Q>> {
		if (`${id}` === '') throw new EmptyParamError('id');
		return (
			await this.transport.patch<OneItem<T, Q>>(`${this.endpoint}/${encodeURI(id as string)}`, item, {
				params: query,
				...options?.requestOptions,
			})
		).data;
	}

	async updateMany<Q extends QueryMany<T>>(
		ids: ID[],
		data: ItemInput<T>,
		query?: Q,
		options?: ItemsOptions
	): Promise<ManyItems<T, Q>> {
		return await this.transport.patch<NonNullable<OneItem<T, Q>>[]>(
			`${this.endpoint}`,
			{
				keys: ids,
				data,
			},
			{
				params: query,
				...options?.requestOptions,
			}
		);
	}

	async updateBatch<Q extends QueryMany<T>>(
		items: ItemInput<T>[],
		query?: Q,
		options?: ItemsOptions
	): Promise<ManyItems<T, Q>> {
		return await this.transport.patch<NonNullable<OneItem<T, Q>>[]>(`${this.endpoint}`, items, {
			params: query,
			...options?.requestOptions,
		});
	}

	async updateByQuery<Q extends QueryMany<T>>(
		updateQuery: QueryMany<T>,
		data: ItemInput<T>,
		query?: Q,
		options?: ItemsOptions
	): Promise<ManyItems<T, Q>> {
		return await this.transport.patch<NonNullable<OneItem<T, Q>>[]>(
			`${this.endpoint}`,
			{
				query: updateQuery,
				data,
			},
			{
				params: query,
				...options?.requestOptions,
			}
		);
	}

	async deleteOne(id: ID, options?: ItemsOptions): Promise<void> {
		if (`${id}` === '') throw new EmptyParamError('id');
		await this.transport.delete(`${this.endpoint}/${encodeURI(id as string)}`, undefined, options?.requestOptions);
	}

	async deleteMany(ids: ID[], options?: ItemsOptions): Promise<void> {
		await this.transport.delete(`${this.endpoint}`, ids, options?.requestOptions);
	}
}
