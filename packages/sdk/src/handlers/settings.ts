/**
 * Settings handler
 */
import { ITransport } from '../transport.js';
import { SettingType, DefaultType } from '../types.js';
import { SingletonHandler } from './singleton.js';

export type SettingItem<T = DefaultType> = SettingType & T;

export class SettingsHandler<T = SettingItem> extends SingletonHandler<T> {
	constructor(transport: ITransport) {
		super('directus_settings', transport);
	}
}
