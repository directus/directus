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

export abstract class IStorage {
	abstract auth_token: string | null;
	abstract auth_expires: number | null;
	abstract auth_expires_at: number | null;
	abstract auth_refresh_token: string | null;

	abstract get(key: string): string | null;
	abstract set(key: string, value: string): string;
	abstract delete(key: string): string | null;
}

export type Field = string;

export type Item = Record<string, any>;

export type ItemInput<T> = {
	[P in keyof T]?: T[P] extends Record<string, any> ? ItemInput<T[P]> : T[P];
};
export type InferQueryType<T extends ManyItems<any> | QueryOne<any>> = 'data' extends keyof T ? T['data'] : T;

export type DefaultItem<T> = {
	[K in keyof T]: NonNullable<T[K]> extends (infer U)[]
		? Extract<NonNullable<U>, Record<string, unknown>> extends never
			? U[]
			: (string | number)[]
		: Extract<T[K], Record<string, unknown>> extends never
		? T[K]
		: Exclude<T[K], Record<string, unknown>> | string | number;
};

export type OneItem<
	T extends Item,
	Q extends QueryOne<T> = Record<'fields', undefined>,
	F extends string[] | false = QueryFields<Q>
> = (F extends false ? DefaultItem<T> : PickedDefaultItem<T, F>) | null | undefined;

export type ManyItems<T extends Item, Q extends QueryMany<T> = Record<string, any>> = {
	data?: NonNullable<OneItem<T, Q>>[] | null;
	meta?: ItemMetadata;
};

export type ItemMetadata = {
	total_count?: number;
	filter_count?: number;
};

export type Payload = Record<string, any>;

export enum Meta {
	TOTAL_COUNT = 'total_count',
	FILTER_COUNT = 'filter_count',
}

export type QueryFields<Q extends Record<string, any>> = Q extends Record<'fields', unknown>
	? Q['fields'] extends string
		? [Q['fields']]
		: Q['fields'] extends string[]
		? Q['fields']
		: false
	: false;

type DeepPathBranchHelper<T, K extends keyof T, V, R extends string> = K extends keyof V
	? TreeBranch<T[K], R, V[K]>
	: K extends keyof (V & { [_ in K]: unknown })
	? TreeBranch<T[K], R, (V & { [_ in K]: unknown })[K]>
	: never;

type WildCardHelper<T, K extends keyof T, V, R extends string> = string extends K
	? { [K: string]: T[K] }
	: NonNullable<T[K]> extends (infer U)[]
	? Extract<NonNullable<U>, Record<string, unknown>> extends never
		? TreeLeaf<U>
		: DeepPathBranchHelper<T, K, V, R>
	: Extract<NonNullable<T[K]>, Record<string, unknown>> extends never
	? TreeLeaf<T[K]>
	: DeepPathBranchHelper<T, K, V, R>;

type DeepPathToObject<
	Path extends string,
	T extends Record<string, any>,
	Val = Record<string, never>
> = string extends Path
	? never
	: Path extends `${infer Key}.${infer Rest}`
	? Key extends '*'
		? Rest extends `${infer NextVal}.${string}`
			? NextVal extends '*'
				? Val & {
						[K in keyof T]: WildCardHelper<T, K, Val, Rest>;
				  }
				: Val & {
						[K in keyof T]: NextVal extends keyof T[K] ? DeepPathBranchHelper<T, K, Val, Rest> : never;
				  }
			: Rest extends '*'
			? Val & {
					[K in keyof T]: WildCardHelper<T, K, Val, Rest>;
			  }
			: Val & {
					[K in keyof T]: Rest extends keyof T[K] ? DeepPathBranchHelper<T, K, Val, Rest> : never;
			  }
		: Key extends keyof T
		? Val & {
				[K in OptionalKeys<Pick<T, Key>>]?: DeepPathBranchHelper<T, K, Val, Rest>;
		  } & {
				[K in RequiredKeys<Pick<T, Key>>]: DeepPathBranchHelper<T, K, Val, Rest>;
		  }
		: never
	: string extends keyof T
	? Val & Record<string, unknown>
	: Path extends keyof T
	? Val & {
			[K in OptionalKeys<Pick<T, Path>>]?: TreeLeaf<T[K]>;
	  } & {
			[K in RequiredKeys<Pick<T, Path>>]: TreeLeaf<T[K]>;
	  }
	: Path extends '*'
	? Val & {
			[K in OptionalKeys<T>]?: TreeLeaf<T[K]>;
	  } & {
			[K in RequiredKeys<T>]: TreeLeaf<T[K]>;
	  }
	: never;

type TreeBranch<
	T,
	Path extends string,
	Val = Record<string, never>,
	NT extends Record<string, any> = NonNullable<T>
> = NT extends (infer U)[]
	? (ArrayTreeBranch<Extract<U, Record<string, unknown>>, Path, Val> | Exclude<U, Record<string, unknown>>)[]
	: IsUnion<T> extends true
	? DeepPathToObject<Path, Extract<T, Record<string, unknown>>, Val> | Exclude<T, Record<string, unknown>>
	: DeepPathToObject<Path, NT, Val>;

type ArrayTreeBranch<
	U,
	Path extends string,
	Val = Record<string, never>,
	NU extends Record<string, any> = NonNullable<U>
> = Extract<NU, Record<string, unknown>> extends infer OB extends Record<string, any>
	? Val extends (infer _)[]
		? DeepPathToObject<Path, OB, Val[number]>
		: DeepPathToObject<Path, OB, Val>
	: Val extends (infer _)[]
	? DeepPathToObject<Path, NU, Val[number]>
	: DeepPathToObject<Path, NU, Val>;

type TreeLeaf<T, NT = NonNullable<T>> = NT extends (infer U)[]
	? Exclude<U, Record<string, unknown>>[]
	: Exclude<T, Record<string, unknown>>;

type UnionToIntersectionFn<TUnion> = (TUnion extends TUnion ? (union: () => TUnion) => void : never) extends (
	intersection: infer Intersection
) => void
	? Intersection
	: never;

type LastUnion<TUnion> = UnionToIntersectionFn<TUnion> extends () => infer Last ? Last : never;

type UnionToTuple<TUnion, TResult extends Array<unknown> = []> = TUnion[] extends never[]
	? TResult
	: UnionToTuple<Exclude<TUnion, LastUnion<TUnion>>, [...TResult, LastUnion<TUnion>]>;

export type PickedDefaultItem<T extends Item, Fields, Val = Record<string, unknown>> = unknown extends T
	? any
	: Fields extends string[]
	? Fields['length'] extends 0
		? T
		: UnionToTuple<Fields[number]> extends [infer First, ...infer Rest]
		? First extends string
			? IntersectionToObject<
					Rest['length'] extends 0
						? DeepPathToObject<First, T, Val>
						: PickedDefaultItem<T, Rest, DeepPathToObject<First, T, Val>>
			  >
			: never
		: never
	: never;

type IntersectionToObject<U> = U extends (infer U2)[]
	? Array<IntersectionToObject<U2>>
	: U extends infer O
	? O extends string
		? string
		: O extends number
		? number
		: O extends symbol
		? symbol
		: O extends boolean
		? boolean
		: {
				[K in keyof O as unknown extends O[K] ? never : K]: O[K] extends (infer U)[]
					? Array<IntersectionToObject<U>>
					: IsUnion<O[K]> extends true
					? IntersectionToObject<O[K]>
					: O[K] extends Record<string, any>
					? IntersectionToObject<O[K]>
					: O[K];
		  }
	: never;

export type QueryOne<T = unknown> = {
	fields?: unknown extends T ? string | string[] : DotSeparated<T, 5> | DotSeparated<T, 5>[];
	search?: string;
	deep?: Deep<T>;
	export?: 'json' | 'csv' | 'xml';
	filter?: Filter<T>;
};

export type QueryMany<T> = QueryOne<T> & {
	sort?: Sort<T>;
	limit?: number;
	offset?: number;
	page?: number;
	meta?: keyof ItemMetadata | '*';
	groupBy?: string | string[];
	aggregate?: Aggregate;
	alias?: Record<string, string>;
};

export type Deep<T> = {
	[K in keyof SingleItem<T>]?: DeepQueryMany<SingleItem<T>[K]>;
};

export type DeepQueryMany<T> = {
	[K in keyof QueryMany<SingleItem<T>> as `_${string & K}`]: QueryMany<SingleItem<T>>[K];
} & {
	[K in keyof NestedObjectKeys<SingleItem<T>>]?: DeepQueryMany<NestedObjectKeys<SingleItem<T>>[K]>;
};

export type NestedObjectKeys<T> = {
	[P in keyof T]: NonNullable<T[P]> extends (infer U)[]
		? Extract<U, Record<string, unknown>> extends Record<string, unknown>
			? Extract<U, Record<string, unknown>>
			: never
		: Extract<NonNullable<T[P]>, Record<string, unknown>> extends Record<string, unknown>
		? Extract<NonNullable<T[P]>, Record<string, unknown>>
		: never;
};

export type SharedAggregate = {
	avg?: string[];
	avgDistinct?: string[];
	count?: string[];
	countDistinct?: string[];
	sum?: string[];
	sumDistinct?: string[];
	min?: string[];
	max?: string[];
};

export type Aggregate = {
	[K in keyof SharedAggregate]: string;
};

export type Sort<T> = (`${Extract<keyof SingleItem<T>, string>}` | `-${Extract<keyof SingleItem<T>, string>}`)[];

export type FilterOperators<T> = {
	_eq?: T;
	_neq?: T;
	_gt?: T;
	_gte?: T;
	_lt?: T;
	_lte?: T;
	_in?: T[];
	_nin?: T[];
	_between?: [T, T];
	_nbetween?: [T, T];
	_contains?: T;
	_ncontains?: T;
	_starts_with?: T;
	_nstarts_with?: T;
	_ends_with?: T;
	_nends_with?: T;
	_empty?: boolean;
	_nempty?: boolean;
	_nnull?: boolean;
	_null?: boolean;
	_intersects?: T;
	_nintersects?: T;
	_intersects_bbox?: T;
	_nintersects_bbox?: T;
};

export type LogicalFilterAnd<T> = { _and: Filter<T>[] };
export type LogicalFilterOr<T> = { _or: Filter<T>[] };
export type LogicalFilter<T> = LogicalFilterAnd<T> | LogicalFilterOr<T>;

export type FieldFilter<T> = {
	[K in keyof SingleItem<T>]?: FilterOperators<SingleItem<T>[K]> | FieldFilter<SingleItem<T>[K]>;
};

export type Filter<T> = LogicalFilter<T> | FieldFilter<T>;

export type ItemsOptions = {
	requestOptions: TransportRequestOptions;
};

type SingleItem<T> = Exclude<Single<T>, ID>;
type Single<T, NT = NonNullable<T>> = NT extends Array<unknown> ? NT[number] : NT;

/**
 * CRUD at its finest
 */
export interface IItems<T extends Item> {
	createOne<Q extends QueryOne<T>>(item: ItemInput<T>, query?: Q, options?: ItemsOptions): Promise<OneItem<T, Q>>;
	createMany<Q extends QueryOne<T>>(items: ItemInput<T>[], query?: Q, options?: ItemsOptions): Promise<ManyItems<T, Q>>;

	readOne<Q extends QueryOne<T>>(id: ID, query?: Q, options?: ItemsOptions): Promise<OneItem<T, Q>>;
	readMany<Q extends QueryMany<T>>(ids: ID[], query?: Q, options?: ItemsOptions): Promise<ManyItems<T, Q>>;
	readByQuery<Q extends QueryMany<T>>(query?: Q, options?: ItemsOptions): Promise<ManyItems<T, Q>>;

	updateOne<Q extends QueryOne<T>>(
		id: ID,
		item: ItemInput<T>,
		query?: Q,
		options?: ItemsOptions
	): Promise<OneItem<T, Q>>;
	updateMany<Q extends QueryMany<T>>(
		ids: ID[],
		item: ItemInput<T>,
		query?: Q,
		options?: ItemsOptions
	): Promise<ManyItems<T, Q>>;
	updateBatch<Q extends QueryMany<T>>(
		items: ItemInput<T>[],
		query?: Q,
		options?: ItemsOptions
	): Promise<ManyItems<T, Q>>;

	deleteOne(id: ID, options?: ItemsOptions): Promise<void>;
	deleteMany(ids: ID[], options?: ItemsOptions): Promise<void>;
}

export class EmptyParamError extends Error {
	constructor(paramName?: string) {
		super(`${paramName ?? 'ID'} cannot be an empty string`);
	}
}

type IsUnion<T, U extends T = T> = T extends unknown ? ([U] extends [T] ? false : true) : false;
type AppendToPath<Path extends string, Appendix extends string> = Path extends '' ? Appendix : `${Path}.${Appendix}`;
type OneLevelUp<Path extends string> = Path extends `${infer Start}.${infer Middle}.${infer Rest}`
	? Rest extends `${string}.${string}.${string}`
		? `${Start}.${Middle}.${OneLevelUp<Rest>}`
		: Rest extends `${infer NewMiddle}.${string}`
		? `${Start}.${Middle}.${NewMiddle}`
		: Rest extends string
		? `${Start}.${Middle}`
		: ''
	: Path extends `${infer Start}.${string}`
	? Start
	: '';

type LevelsToAsterisks<Path extends string> = Path extends `${string}.${string}.${infer Rest}`
	? Rest extends `${string}.${string}.${string}`
		? `*.*.${LevelsToAsterisks<Rest>}`
		: Rest extends `${string}.${string}`
		? `*.*.*.*`
		: Rest extends string
		? `*.*.*`
		: ''
	: Path extends `${string}.${string}`
	? '*.*'
	: Path extends ''
	? ''
	: '*';

type DefaultAppends<
	Path extends string,
	Appendix extends string,
	Nested extends boolean = true,
	Prepend extends boolean = true
> =
	| AppendToPath<Path, Appendix>
	| AppendToPath<LevelsToAsterisks<Path>, Appendix>
	| (Prepend extends true
			?
					| AppendToPath<Path, '*'>
					| AppendToPath<LevelsToAsterisks<Path>, Appendix>
					| (OneLevelUp<Path> extends '' ? never : AppendToPath<AppendToPath<OneLevelUp<Path>, '*'>, Appendix>)
			: never)
	| (Nested extends true
			?
					| AppendToPath<AppendToPath<LevelsToAsterisks<Path>, Appendix>, '*'>
					| AppendToPath<AppendToPath<LevelsToAsterisks<Path>, '*'>, '*'>
					| AppendToPath<AppendToPath<Path, Appendix>, '*'>
					| AppendToPath<AppendToPath<Path, '*'>, '*'>
					| (OneLevelUp<Path> extends ''
							? never
							: AppendToPath<AppendToPath<AppendToPath<OneLevelUp<Path>, '*'>, Appendix>, '*'>)
			: never);

type DotSeparated<
	T,
	N extends number,
	Level extends number[] = [],
	Path extends string = ''
> = Level['length'] extends N
	? Path
	: T extends (infer U)[]
	? Extract<U, Record<string, unknown>> extends Record<string, unknown>
		? DotSeparated<Extract<U, Record<string, unknown>>, N, Level, Path>
		: Path
	: Extract<NonNullable<T>, Record<string, unknown>> extends Record<string, unknown>
	? {
			[K in keyof T]: K extends string
				? NonNullable<T[K]> extends (infer U)[]
					? Extract<U, Record<string, unknown>> extends never
						? DefaultAppends<Path, K, false>
						:
								| DotSeparated<Extract<U, Record<string, unknown>>, N, [...Level, 0], AppendToPath<Path, K>>
								| DefaultAppends<Path, K>
					: Extract<T[K], Record<string, unknown>> extends never
					? DefaultAppends<Path, K, false>
					:
							| DotSeparated<Extract<T[K], Record<string, unknown>>, N, [...Level, 0], AppendToPath<Path, K>>
							| DefaultAppends<Path, K>
				: never;
	  }[keyof T]
	: never;

export interface ISingleton<T extends Item> {
	read<Q extends QueryOne<T>>(query?: Q): Promise<OneItem<T, Q>>;
	update<Q extends QueryOne<T>>(item: ItemInput<T>, query?: Q): Promise<OneItem<T, Q>>;
}

export type TransportMethods = 'get' | 'delete' | 'head' | 'options' | 'post' | 'put' | 'patch' | 'search';

export type ResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';

export type TransportRequestOptions = {
	params?: Record<string, any>;
	headers?: Record<string, string | null>;
	responseType?: ResponseType;
	credentials?: RequestCredentials;
	onUploadProgress?: ((progressEvent: any) => void) | undefined;
};

export type RequestConfig = TransportRequestOptions & {
	url: string | URL;
	method: TransportMethods;
	body?: string;
	onUploadProgress?: ((progressEvent: any) => void) | undefined;
};

export type TransportOptions = {
	url: string;
	beforeRequest?: (config: RequestConfig) => Promise<RequestConfig>;
};

export type TransportErrorDescription = {
	message?: string;
	extensions?: Record<string, any> & {
		code?: string;
	};
};

export type TransportResponse<T, R = any> = {
	raw: R;
	data?: T;
	meta?: ItemMetadata;
	errors?: TransportErrorDescription[];
	status: number;
	statusText?: string;
	headers: any;
};
