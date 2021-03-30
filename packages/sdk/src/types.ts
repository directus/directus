export type ID = string | number;

export type DefaultType = {
	[field: string]: any;
};

export type TypeMap = {
	[k: string]: unknown;
};

export type TypeOf<T extends TypeMap, K extends keyof T> = T[K] extends undefined ? DefaultType : T[K];

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
	// TODO: complete
};

export type FieldType = {
	// TODO: complete
};

export type FileType = {
	// TODO: complete
};

export type FolderType = {
	// TODO: complete
};

export type PermissionType = {
	// TODO: complete
};

export type PresetType = {
	// TODO: complete
};

export type RelationType = {
	// TODO: complete
};

export type RevisionType = {
	// TODO: complete
};

export type RoleType = {
	// TODO: complete
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
	// TODO: complete
};
