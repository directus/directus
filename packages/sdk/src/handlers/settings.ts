/**
 * Settings handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { SettingType, DefaultType } from '../types';

export type SettingItem<T = DefaultType> = SettingType & T;

export class SettingsHandler<T = DefaultType> extends ItemsHandler<SettingItem<T>> {
	constructor(transport: ITransport) {
		super('directus_settings', transport);
	}
}
