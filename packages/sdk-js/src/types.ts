export type ID = string | number;

export type ActivityType = {
	action: string;
	ip: string;
	item: string;
	user_agent: string;
	timestamp: string;
	id: number;
	user: string;
	comment: string | null;
	collection: string;
	revisions: [number] | null;
};

export type Comment = {
	item: string;
	collection: string;
	comment: string;
};

export type CollectionType = {
	[field: string]: any;
};

export type FieldType = {
	[field: string]: any;
};

export type FileType = {
	[field: string]: any;
};

export type FolderType = {
	[field: string]: any;
};

export type PermissionType = {
	[field: string]: any;
};

export type PresetType = {
	[field: string]: any;
};

export type RelationType = {
	[field: string]: any;
};

export type RevisionType = {
	[field: string]: any;
};

export type RoleType = {
	[field: string]: any;
};

export type SettingType = {
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
};

export type UserType = {
	[field: string]: any;
};
