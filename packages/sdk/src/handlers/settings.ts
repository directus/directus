/**
 * Settings handler
 */
import { Item } from '../items';
import { Transport } from '../transport';
import { SettingType, DefaultType } from '../types';
import { SingletonHandler } from './singleton';

export type SettingItem<T = DefaultType> = SettingType & T;

export class SettingsHandler<T extends Item = SettingItem> extends SingletonHandler<T> {
	constructor(transport: Transport) {
		super('directus_settings', transport);
	}
}
