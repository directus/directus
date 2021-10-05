import { ITransport } from '../transport.js';
import { QueryOne, OneItem, PartialItem } from '../items.js';
import { ISingleton } from '../singleton.js';

export class SingletonHandler<T> implements ISingleton<T> {
	protected collection: string;
	protected transport: ITransport;
	protected endpoint: string;

	constructor(collection: string, transport: ITransport) {
		this.collection = collection;
		this.transport = transport;
		this.endpoint = collection.startsWith('directus_') ? `/${collection.substring(9)}` : `/items/${collection}`;
	}

	async read(query?: QueryOne<T>): Promise<OneItem<T>> {
		const item = await this.transport.get<T>(`${this.endpoint}`, {
			params: query,
		});
		return item.data;
	}

	async update(data: PartialItem<T>, _query?: QueryOne<T>): Promise<OneItem<T>> {
		const item = await this.transport.patch<T>(`${this.endpoint}`, data, {
			params: _query,
		});

		return item.data;
	}
}
