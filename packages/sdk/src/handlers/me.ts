import { ItemInput, QueryOne } from '../items';
import { ITransport } from '../transport';
import { TFAHandler } from './tfa';

export class MeHandler<T> {
	private _transport: ITransport;
	private _tfa?: TFAHandler;

	constructor(transport: ITransport) {
		this._transport = transport;
	}

	get tfa(): TFAHandler {
		return this._tfa || (this._tfa = new TFAHandler(this._transport));
	}

	async read(query?: QueryOne<T>): Promise<ItemInput<T>> {
		const response = await this._transport.get<T>('/users/me', {
			params: query,
		});

		return response.data!;
	}

	async update(data: ItemInput<T>, query?: QueryOne<T>): Promise<ItemInput<T>> {
		const response = await this._transport.patch<T>(`/users/me`, data, {
			params: query,
		});

		return response.data!;
	}
}
