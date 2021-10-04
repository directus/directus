import { PartialItem, QueryOne } from '@/src/items.js';
import { ITransport } from '@/src/transport.js';
import { TFAHandler } from '@/src/handlers/tfa.js';

export class MeHandler<T> {
	private _transport: ITransport;
	private _tfa?: TFAHandler;

	constructor(transport: ITransport) {
		this._transport = transport;
	}

	get tfa(): TFAHandler {
		return this._tfa || (this._tfa = new TFAHandler(this._transport));
	}

	async read(query?: QueryOne<T>): Promise<PartialItem<T>> {
		const response = await this._transport.get<T>('/users/me', {
			params: query,
		});
		return response.data!;
	}

	async update(data: PartialItem<T>, query?: QueryOne<T>): Promise<PartialItem<T>> {
		const response = await this._transport.patch<T>(`/users/me`, data, {
			params: query,
		});
		return response.data!;
	}
}
