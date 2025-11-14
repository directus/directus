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
	report_error_url: string | null;
	report_bug_url: string | null;
	report_feature_url: string | null;
	default_language: string | null;
	project_color: string | null;
	project_logo: string | null;
	public_foreground: string | null;
	public_background: { id: string; type: string } | null;
	public_favicon: string | null;
	public_note: string | null;
	visual_editor_urls: Array<{ url: string }> | null;
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
	default_appearance: 'auto' | 'light' | 'dark';
	default_theme_light: string | null;
	default_theme_dark: string | null;
	theme_light_overrides: Record<string, unknown> | null;
	theme_dark_overrides: Record<string, unknown> | null;
	project_id: string | null;
} & OwnerInformation;

export type OwnerInformation = {
	project_owner: string | null;
	project_usage: 'personal' | 'commercial' | 'community' | null;
	org_name: string | null;
	product_updates: boolean;
};

export type SetupForm = {
	first_name: string | null;
	last_name: string | null;
	password: string | null;
	password_confirm: string | null;
	license: boolean;
} & OwnerInformation;
