export interface DirectusCollections {
	collection?: string;
	icon?: string;
	note?: string;
	display_template?: string;
	hidden: boolean;
	singleton: boolean;
	translations?: any[] | Record<string, any>;
	archive_field?: string;
	archive_app_filter: boolean;
	archive_value?: string;
	unarchive_value?: string;
	sort_field?: string;
	accountability?: string;
	color?: string;
	item_duplication_fields?: any[] | Record<string, any>;
	collection_divider: string;
	archive_divider: string;
	sort_divider: string;
	accountability_divider: string;
	duplication_divider: string;
}

export interface DirectusMigrations {
	version: string;
	name: string;
	timestamp?: string;
}

export interface DirectusActivity {
	id: number;
	action: string;
	user?: string;
	timestamp: string;
	ip: string;
	user_agent?: string;
	collection: string;
	item: string;
	comment?: string;
	revisions: string;
}

export interface DirectusFolders {
	id: string;
	name: string;
	parent?: string;
}

export interface DirectusRelations {
	id: number;
	many_collection: string;
	many_field: string;
	one_collection?: string;
	one_field?: string;
	one_collection_field?: string;
	one_allowed_collections?: any[] | Record<string, any>;
	junction_field?: string;
	sort_field?: string;
	one_deselect_action: string;
}

export interface DirectusRevisions {
	id: number;
	activity: number;
	collection: string;
	item: string;
	data?: any[] | Record<string, any>;
	delta?: any[] | Record<string, any>;
	parent?: number;
}

export interface DirectusSessions {
	token: string;
	user: string;
	expires: string;
	ip?: string;
	user_agent?: string;
	data?: any[] | Record<string, any>;
}

export interface DirectusDashboards {
	id?: string;
	name: string;
	icon: string;
	note?: string;
	date_created?: string;
	user_created?: string;
	panels: string;
}

export interface DirectusPanels {
	id?: string;
	dashboard: string;
	name?: string;
	icon?: string;
	color?: string;
	show_header: boolean;
	note?: string;
	type: string;
	position_x: number;
	position_y: number;
	width: number;
	height: number;
	options?: any[] | Record<string, any>;
	date_created?: string;
	user_created?: string;
}

export interface DirectusFiles {
	id: string;
	storage: string;
	filename_disk?: string;
	filename_download: string;
	title?: string;
	type?: string;
	folder?: string;
	uploaded_by?: string;
	uploaded_on: string;
	modified_by?: string;
	modified_on: string;
	charset?: string;
	filesize?: number;
	width?: number;
	height?: number;
	duration?: number;
	embed?: string;
	description?: string;
	location?: string;
	tags?: any[] | Record<string, any>;
	metadata?: any[] | Record<string, any>;
	test?: string;
	storage_divider: string;
}

export interface DirectusSettings {
	id: number;
	project_name: string;
	project_url?: string;
	project_color?: string;
	project_logo?: string;
	public_foreground?: string;
	public_background?: string;
	public_note?: string;
	auth_login_attempts?: number;
	auth_password_policy?: string;
	storage_asset_transform?: string;
	storage_asset_presets?: any[] | Record<string, any>;
	custom_css?: string;
	storage_default_folder?: string;
	basemaps?: any[] | Record<string, any>;
	mapbox_key?: string;
	module_bar?: any[] | Record<string, any>;
	public_divider: string;
	security_divider: string;
	files_divider: string;
	overrides_divider: string;
	map_divider: string;
	modules_divider: string;
}

export interface DirectusPermissions {
	id: number;
	role?: string;
	collection: string;
	action: string;
	permissions?: any[] | Record<string, any>;
	validation?: any[] | Record<string, any>;
	presets?: any[] | Record<string, any>;
	fields?: any[] | Record<string, any>;
}

export interface DirectusUsers {
	id?: string;
	first_name?: string;
	last_name?: string;
	email?: string;
	password?: string;
	location?: string;
	title?: string;
	description?: string;
	tags?: any[] | Record<string, any>;
	avatar?: string;
	language?: string;
	theme?: string;
	tfa_secret?: string;
	status: string;
	role?: string;
	token?: string;
	last_access?: string;
	last_page?: string;
	provider: string;
	external_identifier?: string;
	preferences_divider: string;
	admin_divider: string;
}

export interface DirectusRoles {
	id?: string;
	name: string;
	icon: string;
	description?: string;
	ip_access?: any[] | Record<string, any>;
	enforce_tfa: boolean;
	collection_list?: any[] | Record<string, any>;
	admin_access: boolean;
	app_access: boolean;
	users: string;
}

export interface DirectusWebhooks {
	id: number;
	name: string;
	method: string;
	url: string;
	status: string;
	data: boolean;
	actions: any[] | Record<string, any>;
	collections: any[] | Record<string, any>;
	triggers_divider: string;
}

export interface DirectusFields {
	id: number;
	collection: string;
	field: string;
	special?: any[] | Record<string, any>;
	interface?: string;
	options?: any[] | Record<string, any>;
	display?: string;
	display_options?: any[] | Record<string, any>;
	readonly: boolean;
	hidden: boolean;
	sort?: number;
	width?: string;
	translations?: any[] | Record<string, any>;
	note?: string;
	conditions?: any[] | Record<string, any>;
	required?: boolean;
	group?: string;
}

export interface DirectusPresets {
	id: number;
	bookmark?: string;
	user?: string;
	role?: string;
	collection?: string;
	search?: string;
	filters?: unknown;
	layout?: string;
	layout_query?: unknown;
	layout_options?: unknown;
	refresh_interval?: number;
}

export type DirectusSystemTypes = {
	directus_collections: DirectusCollections;
	directus_migrations: DirectusMigrations;
	directus_activity: DirectusActivity;
	directus_folders: DirectusFolders;
	directus_relations: DirectusRelations;
	directus_revisions: DirectusRevisions;
	directus_sessions: DirectusSessions;
	directus_dashboards: DirectusDashboards;
	directus_panels: DirectusPanels;
	directus_files: DirectusFiles;
	directus_settings: DirectusSettings;
	directus_permissions: DirectusPermissions;
	directus_users: DirectusUsers;
	directus_roles: DirectusRoles;
	directus_webhooks: DirectusWebhooks;
	directus_fields: DirectusFields;
	directus_presets: DirectusPresets;
};
