export type SettingsModuleBarModule = {
	type: 'module';
	id: string;
	enabled: boolean;
	locked?: boolean;
};

export type SettingsModuleBarLink = {
	type: 'link';
	id: string;
	url: string;
	icon: string;
	name: string;
	enabled: boolean;
	locked?: boolean;
};

export type SettingsStorageAssetPreset = {
	key: string | null;
	fit: 'contain' | 'cover' | 'inside' | 'outside' | null;
	width: number | null;
	height: number | null;
	quality: number | null;
	withoutEnlargement: boolean | null;
	format: 'jpeg' | 'png' | 'webp' | 'tiff' | 'avif' | null;
	transforms: any[] | null;
};

export type CustomAspectRatio = {
	text: string;
	value: number;
};

export type Settings = {
	id: 1;
	project_name: string;
	project_descriptor: string | null;
	project_url: string | null;
	default_language: string | null;
	project_color: string | null;
	project_logo: string | null;
	public_foreground: string | null;
	public_background: string | null;
	public_note: string | null;
	auth_login_attempts: number;
	auth_password_policy: string | null;
	storage_asset_transform: string;
	storage_asset_presets: SettingsStorageAssetPreset[] | null;
	custom_aspect_ratios: CustomAspectRatio[] | null;
	custom_css: string | null;
	storage_default_folder: string | null;
	basemaps: any[] | null;
	mapbox_key: string | null;
	module_bar: (SettingsModuleBarLink | SettingsModuleBarModule)[];
};
