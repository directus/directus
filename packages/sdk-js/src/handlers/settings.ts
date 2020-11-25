import { AxiosInstance } from 'axios';
import { Item } from '../types';
import { ItemsHandler } from './items';

export type DirectusSettigns = {
	auth_login_attempts: number;
	auth_password_policy: string | null;
	custom_css: string | null;
	id: 1;
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
};

export class SettingsHandler<T extends Item> extends ItemsHandler<DirectusSettigns & T> {
	constructor(axios: AxiosInstance) {
		super('directus_settings', axios);
	}
}
