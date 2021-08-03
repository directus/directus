/**
 * Settings handler
 */

import { ITransport } from '../transport';
import { SettingType, DefaultType } from '../types';

export type SettingItem<T = DefaultType> = SettingType & T;

export class SettingsHandler<T = DefaultType> {
	transport: ITransport;
	constructor(transport: ITransport) {
		this.transport = transport;
	}
}
