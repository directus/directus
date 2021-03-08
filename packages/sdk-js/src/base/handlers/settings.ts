/**
 * Settings handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';

export type Settings<T extends object = DefaultFields> = {
	id: 1;
	auth_login_attempts: number;
	auth_password_policy: string | null;
	custom_css: string | null;
	project_color: string | null;
	project_logo: string | null;
	project_name: string;
	project_url: string;
	public_background: string | null;
	public_foreground: string | null;
	public_note: string | null;
	storage_asset_presets:
		| {
				fit: string;
				height: number;
				width: number;
				quality: number;
				key: string;
				withoutEnlargement: boolean;
		  }[]
		| null;
	storage_asset_transform: 'none' | 'all' | 'presets';
} & T;

export class SettingsHandler<T extends object> extends ItemsHandler<Settings<T>> {
	constructor(transport: ITransport) {
		super('directus_settings', transport);
	}
}
