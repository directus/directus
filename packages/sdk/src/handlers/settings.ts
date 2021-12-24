/**
 * Settings handler
 */
import { ITransport } from '../transport';
import { SettingType, DefaultType } from '../types';
import { SingletonHandler } from './singleton';

export type SettingItem<T = DefaultType> = SettingType & T;

export class SettingsHandler<T = SettingItem> extends SingletonHandler<T> {
	constructor(transport: ITransport) {
		super('directus_settings', transport);
	}
}
