import type { MergeCoreCollection } from '../index.js';
import type { DirectusFolder } from './folder.js';

export type DirectusSettings<Schema extends object> = MergeCoreCollection<
	Schema,
	'directus_settings',
	{
		id: 1;
		project_name: string;
		project_url: string;
		project_color: string | null;
		project_logo: string | null;
		public_foreground: string | null;
		public_background: string | null;
		public_note: string | null;
		auth_login_attempts: number;
		auth_password_policy: string | null;
		storage_asset_transform: 'all' | 'none' | 'presets';
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
		custom_css: string | null;
		storage_default_folder: DirectusFolder<Schema> | string | null;
		basemaps: Record<string, any> | null;
		mapbox_key: string | null;
		module_bar: 'json' | null;
		project_descriptor: string | null;
		default_language: string;
		custom_aspect_ratios: Record<string, any> | null;
	}
>;
