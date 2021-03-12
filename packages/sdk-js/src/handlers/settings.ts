/**
 * Settings handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { SettingType } from '../types';

export type SettingItem<T extends object = {}> = SettingType & T;

export class SettingsHandler<T extends object> extends ItemsHandler<SettingItem<T>> {
	constructor(transport: ITransport) {
		super('directus_settings', transport);
	}
}
