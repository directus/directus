/**
 * Settings handler
 */
import { ITransport } from '@/src/transport.js';
import { SettingType, DefaultType } from '@/src/types.js';
import { SingletonHandler } from '@/src/handlers/singleton.js';

export type SettingItem<T = DefaultType> = SettingType & T;

export class SettingsHandler<T = SettingItem> extends SingletonHandler<T> {
	constructor(transport: ITransport) {
		super('directus_settings', transport);
	}
}
