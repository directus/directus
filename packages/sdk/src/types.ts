export type ID = number | string;

export type DefaultType = {
	[field: string]: any;
};

export type SystemType<T> = DefaultType & T;

export type TypeMap = {
	[k: string]: unknown;
};

export type TypeOf<T extends TypeMap, K extends keyof T> = T[K] extends undefined ? DefaultType : T[K];

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type ActivityType = SystemType<{
	// TODO: review
	action: string;
	collection: string;
	comment: string | null;
	id: number;
	ip: string;
	item: string;
	origin: string | null;
	timestamp: string;
	revisions: number[];
	user: string;
	user_agent: string;
}>;

export type Comment = SystemType<{
	// TODO: review
	collection: string;
	comment: string;
	item: string;
}>;

export type CollectionType = SystemType<{
	// TODO: review
	collection: string;
	meta: CollectionMetaType;
	schema: CollectionSchemaType | null;
}>;

export type CollectionMetaType = SystemType<{
	// TODO: review
	accountability: string | null;
	archive_app_filter: boolean;
	archive_field: string | null;
	archive_value: string | null;
	collapse: string;
	collection: string;
	display_template: string | null;
	group: string | null;
	hidden: boolean;
	icon: string | null;
	item_duplication_fields: string[] | null;
	note: string | null;
	singleton: boolean;
	sort_field: string | null;
	translations: CollectionMetaTranslationType[] | null;
	unarchive_value: string | null;
}>;

export type CollectionMetaTranslationType = SystemType<{
	// TODO: review
	language: string;
	plural: string;
	singular: string;
	translation: string;
}>;

export type CollectionSchemaType = SystemType<{
	// TODO: review
	comment: string | null;
	name: string;
	schema: string;
}>;

export type FieldType = SystemType<{
	// TODO: complete
	collection: string;
	field: string;
	meta: FieldMetaType;
	schema: FieldSchemaType;
	type: string;
}>;

export type FieldMetaType = SystemType<{
	// TODO: review
	collection: string;
	conditions: FieldMetaConditionType[] | null;
	display: string | null;
	display_options: string | null;
	field: string;
	group: string | null;
	hidden: boolean;
	id: number;
	interface: string;
	note: string | null;
	// TODO: options vary by field type
	options: DefaultType | null;
	readonly: boolean;
	required: boolean;
	sort: number | null;
	special: string[] | null;
	translations: FieldMetaTranslationType[] | null;
	validation: DefaultType | null;
	validation_message: string | null;
	width: string;
}>;

export type FieldMetaConditionType = SystemType<{
	// TODO: review
	hidden: boolean;
	name: string;
	options: FieldMetaConditionOptionType;
	readonly: boolean;
	required: boolean;
	// TODO: rules use atomic operators and can nest
	rule: DefaultType;
}>;

export type FieldMetaTranslationType = SystemType<{
	// TODO: review
	language: string;
	translation: string;
}>;

export type FieldMetaConditionOptionType = SystemType<{
	// TODO: review
	clear: boolean;
	font: string;
	iconLeft?: string;
	iconRight?: string;
	masked: boolean;
	placeholder: string;
	slug: boolean;
	softLength?: number;
	trim: boolean;
}>;

export type FieldSchemaType = SystemType<{
	// TODO: review
	comment: string | null;
	data_type: string;
	default_value: any | null;
	foreign_key_column: string | null;
	foreign_key_schema: string | null;
	foreign_key_table: string | null;
	generation_expression: unknown | null;
	has_auto_increment: boolean;
	is_generated: boolean;
	is_nullable: boolean;
	is_primary_key: boolean;
	is_unique: boolean;
	max_length: number | null;
	name: string;
	numeric_precision: number | null;
	numeric_scale: number | null;
	schema: string;
	table: string;
}>;

export type FileType = SystemType<{
	// TODO: review
	charset: string | null;
	description: string | null;
	duration: number | null;
	embed: unknown | null;
	filename_disk: string;
	filename_download: string;
	filesize: string;
	folder: string;
	height: number | null;
	id: string;
	location: string | null;
	// TODO: is it possible to determine all possible metadata?
	metadata: DefaultType;
	modified_by: string;
	modified_on: string;
	storage: string;
	tags: string[];
	title: string;
	type: string;
	uploaded_by: string;
	uploaded_on: string;
	width: number | null;
}>;

export type FolderType = SystemType<{
	// TODO: review
	id: string;
	name: string;
	parent: string;
}>;

export type PermissionType = SystemType<{
	// TODO: review
	action: string;
	collection: string | null;
	fields: string[];
	id: string;
	// TODO: object will vary by schema
	permissions: DefaultType;
	// TODO: object will vary by schema
	presets: DefaultType | null;
	role: string | null;
	system?: boolean;
	// TODO: object will vary by schema
	validation: DefaultType | null;
}>;

export type PresetType = SystemType<{
	// TODO: review
	collection: string;
	color: string | null;
	bookmark: string | null;
	// TODO: rules use atomic operators and can nest
	filter: DefaultType;
	icon: string | null;
	id: number;
	layout: string | null;
	// TODO: determine possible properties
	layout_options: DefaultType;
	// TODO: determine possible properties
	layout_query: DefaultType;
	refresh_interval: number | null;
	role: string | null;
	search: string | null;
	user: string | null;
}>;

export type RelationType = SystemType<{
	// TODO: review
	collection: string;
	field: string;
	related_collection: string;
	schema: RelationSchemaType;
	meta: RelationMetaType;
}>;

export type RelationMetaType = SystemType<{
	// TODO: review
	id: number | null;
	junction_field: string | null;
	many_collection: string | null;
	many_field: string | null;
	one_allowed_collections: string | null;
	one_collection: string | null;
	one_collection_field: string | null;
	one_deselect_action: string;
	one_field: string | null;
	sort_field: string | null;
	system: boolean | null;
}>;

export type RelationSchemaType = SystemType<{
	// TODO: review
	column: string;
	constraint_name: string;
	foreign_key_column: string;
	foreign_key_schema: string;
	foreign_key_table: string;
	on_delete: string;
	on_update: string;
	table: string;
}>;

export type RevisionType = SystemType<{
	// TODO: review
	activity: number;
	collection: string;
	// TODO: object will vary by schema
	data: DefaultType;
	// TODO: object will vary by schema
	delta: DefaultType;
	id: number;
	item: string;
	parent: number | null;
}>;

export type RoleType = SystemType<{
	// TODO: review
	admin_access: boolean;
	app_access: boolean;
	description: string | null;
	enforce_tfa: boolean;
	icon: string;
	id: string;
	ip_access: string[] | null;
	name: string;
	users: string[];
}>;

export type SettingType = SystemType<{
	// TODO: review
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

export type UserType = SystemType<{
	// TODO: review
	// TODO: determine possible properties
	auth_data: DefaultType;
	avatar: string;
	description: string | null;
	email: string | null;
	email_notifications: boolean;
	external_identifier: string;
	first_name: string | null;
	id: string;
	language: string | null;
	last_access: string | null;
	last_name: string | null;
	last_page: string | null;
	location: string | null;
	password: string | null; // will just be *s
	provider: string;
	role: string;
	status: string;
	tags: string[];
	theme: string;
	tfa_secret: string | null;
	title: string | null;
	token: string | null;
}>;

export type TfaType = SystemType<{
	secret: string;
	otpauth_url: string;
}>;

export type RequiredKeys<T> = {
	[K in keyof T]-?: Record<string, never> extends { [P in K]: T[K] } ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
	[K in keyof T]-?: Record<string, never> extends { [P in K]: T[K] } ? K : never;
}[keyof T];
