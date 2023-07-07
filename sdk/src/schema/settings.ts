import type { CoreCollection } from "../index.js";

export type DirectusSettings<Schema extends object> = CoreCollection<Schema, 'directus_settings', {
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
	storage_asset_transform: 'all' | 'none' | 'presets';
}>;
