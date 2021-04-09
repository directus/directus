import { ITransport } from '../transport';
import { QueryOne, OneItem, PartialItem } from '../items';
import { ISingleton } from '../singleton';

export class SingletonHandler<T> implements ISingleton<T> {
	protected collection: string;
	protected transport: ITransport;

	constructor(collection: string, transport: ITransport) {
		this.collection = collection;
		this.transport = transport;
	}

	async read(query?: QueryOne<T>): Promise<OneItem<T>> {
		const item = await this.transport.get<T>(`/items/${this.collection}`, {
			params: query,
		});
		return item.data;
	}

	async update(data: PartialItem<T>, _query?: QueryOne<T>): Promise<OneItem<T>> {
		const item = await this.transport.patch<T>(`/items/${this.collection}`, data, {
			params: _query,
		});
		return item.data;
	}
}
