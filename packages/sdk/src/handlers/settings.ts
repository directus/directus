/**
 * Settings handler
 */
import { OneItem, PartialItem, QueryOne } from '../items';
import { ITransport } from '../transport';
import { SettingType, DefaultType } from '../types';

export type SettingItem<T = DefaultType> = SettingType & T;

export class SettingsHandler<T = DefaultType> {
	transport: ITransport;
	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async read(query?: QueryOne<T>): Promise<OneItem<T>> {
		const item = await this.transport.get<T>(`/settings`, {
			params: query,
		});
		return item.data;
	}

	async update(data: PartialItem<T>, _query?: QueryOne<T>): Promise<OneItem<T>> {
		const item = await this.transport.patch<T>(`/settings`, data, {
			params: _query,
		});
		return item.data;
	}
}
