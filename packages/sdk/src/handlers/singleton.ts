import { ITransport } from '../transport';
import { QueryOne, OneItem, ItemInput, Item } from '../items';
import { ISingleton } from '../singleton';

export class SingletonHandler<T extends Item> implements ISingleton<T> {
	protected collection: string;
	protected transport: ITransport;
	protected endpoint: string;

	constructor(collection: string, transport: ITransport) {
		this.collection = collection;
		this.transport = transport;
		this.endpoint = collection.startsWith('directus_') ? `/${collection.substring(9)}` : `/items/${collection}`;
	}

	async read<Q extends QueryOne<T>>(query?: Q): Promise<OneItem<T, Q>> {
		const item = await this.transport.get<OneItem<T, Q>>(`${this.endpoint}`, {
			params: query,
		});

		return item.data;
	}

	async update<Q extends QueryOne<T>>(data: ItemInput<T>, _query?: Q): Promise<OneItem<T, Q>> {
		const item = await this.transport.patch<OneItem<T, Q>>(`${this.endpoint}`, data, {
			params: _query,
		});

		return item.data;
	}
}
