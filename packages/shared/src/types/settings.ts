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

export type Settings = {
	id: 1;
	project_name: string;
	project_url: string | null;
	project_color: string | null;
	project_logo: string | null;
	public_foreground: string | null;
	public_background: string | null;
	public_note: string | null;
	auth_login_attempts: number;
	auth_password_policy: string | null;
	storage_asset_transform: string;
	storage_asset_presets:
		| {
				key: string | null;
				fit: 'contain' | 'cover' | 'inside' | 'outside' | null;
				width: number | null;
				height: number | null;
				quality: number | null;
				withoutEnlargement: boolean | null;
				format: 'jpeg' | 'png' | 'webp' | 'tiff' | null;
				transforms: any[] | null;
		  }[]
		| null;
	custom_css: string | null;
	storage_default_folder: string | null;
	basemaps: any[] | null;
	mapbox_key: string | null;
	module_bar: (SettingsModuleBarLink | SettingsModuleBarModule)[];
};
