import type { ItemType, RelationalFields, RemoveRelationships, UnpackList } from './schema.js';

/**
 * All query options available
 */
export interface Query<Schema extends object, Item> {
	fields?: QueryFields<Schema, Item> | undefined;
	filter?: QueryFilter<Schema, Item> | undefined;
	search?: string | undefined;
	sort?: QuerySort<Schema, Item> | QuerySort<Schema, Item>[] | undefined;
	limit?: number | undefined;
	offset?: number | undefined;
	page?: number | undefined;
	deep?: QueryDeep<Schema, Item> | undefined;
	alias?: QueryAlias<Schema, Item> | undefined;
}

/**
 * Fields querying, including nested relational fields
 */
export type QueryFields<Schema extends object, Item> = (
	| '*'
	| keyof UnpackList<Item>
	| QueryFieldsRelational<Schema, UnpackList<Item>>
)[];

/**
 * Object of nested relational fields in a given Item with it's own fields available for selection
 */
export type QueryFieldsRelational<Schema extends object, Item> = {
	[Key in RelationalFields<Schema, Item>]?: Item[Key] extends object
		? QueryFields<Schema, ExtractItem<Schema, Item[Key]>>
		: ExtractItem<Schema, Item[Key]> extends infer Fields
		? {
				[Collection in keyof Schema as Fields extends UnpackList<Schema[Collection]> ? Collection : never]: QueryFields<
					Schema,
					Schema[Collection]
				>;
		  }
		: never;
};

/**
 * Returns Item types that are available in the root Schema
 */
export type ExtractItem<Schema extends object, Item> = Extract<UnpackList<Item>, ItemType<Schema>>;

/**
 * Returns the relation type from the current item by key
 */
export type ExtractRelation<Schema extends object, Item extends object, Key> = Key extends keyof Item
	? ExtractItem<Schema, Item> extends infer Relation
		? Relation extends never
			? never
			: Relation
		: never
	: never;

/**
 * Returns true if the Fields has any nested field
 */
export type HasNestedFields<Fields> = UnpackList<Fields> extends infer Field
	? Field extends object
		? true
		: never
	: never;

/**
 * Return all keys if Fields is undefined or contains '*'
 */
export type FieldsWildcard<Item extends object, Fields> = UnpackList<Fields> extends infer Field
	? Field extends undefined
		? keyof Item
		: Field extends '*'
		? keyof Item
		: Field extends string
		? Field
		: never
	: never;

/**
 * Returns the relational fields from the fields list
 */
export type RelationalQueryFields<Fields> = UnpackList<Fields> extends infer Field
	? Field extends object
		? Field
		: never
	: never;

/**
 * Extract the required fields from an item
 */
export type PickFlatFields<Schema extends object, Item, Fields> = Pick<
	RemoveRelationships<Schema, Item>,
	Extract<Fields, keyof Item>
>;

/**
 * Apply the configured fields query parameter on a given Item type
 */
export type ApplyQueryFields<Schema extends object, Item, Fields> = Item extends object
	? HasNestedFields<Fields> extends never
		? PickFlatFields<Schema, Item, FieldsWildcard<Item, Fields>> // no relation
		: RelationalQueryFields<Fields> extends infer RelatedFields // infer related fields
		? PickFlatFields<Schema, Item, Exclude<FieldsWildcard<Item, Fields>, keyof RelatedFields>> & {
				[K in keyof RelatedFields]-?: K extends keyof Item
					? QueryFields<Schema, ExtractItem<Schema, Item[K]>> extends RelatedFields[K]
						? ExtractRelation<Schema, Item, K> extends infer Relation
							? Relation extends object
								? ApplyQueryFields<Schema, Relation, RelatedFields[K]> // recursively build the result
								: never
							: never
						: ApplyManyToAny<Schema, RelatedFields[K]> // TODO FIX M2A OUTPUT
					: never;
		  }
		: never
	: never;

type ApplyManyToAny<Schema extends object, Scopes> = Scopes extends object
	? {
			[Scope in keyof Scopes]: Scope extends keyof Schema
				? ApplyQueryFields<Schema, UnpackList<Schema[Scope]>, Scopes[Scope]> // TODO FIX THIS! does not work!
				: never;
	  }
	: never;

/**
 * Filters
 */
export type QueryFilter<Schema extends object, Item> = UnpackList<Item> extends infer FlatItem
	? {
			[Field in keyof FlatItem]?:
				| (Field extends RelationalFields<Schema, FlatItem> ? QueryFilter<Schema, FlatItem[Field]> : never)
				| FilterOperatorsByType<FlatItem[Field]>;
	  }
	: never;

/**
 * All available filter operators
 * TODO would love to filter this based on field type but thats not accurate enough in the schema atm
 */
export type FilterOperatorsByType<T> = {
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
	_istarts_with?: T;
	_nstarts_with?: T;
	_nistarts_with?: T;
	_ends_with?: T;
	_iends_with?: T;
	_nends_with?: T;
	_niends_with?: T;
	_empty?: boolean;
	_nempty?: boolean;
	_nnull?: boolean;
	_null?: boolean;
	_intersects?: T;
	_nintersects?: T;
	_intersects_bbox?: T;
	_nintersects_bbox?: T;
};

/**
 * Query sort
 * TODO expand to relational sorting (same object notation as fields i guess)
 */
export type QuerySort<_Schema extends object, Item> = UnpackList<Item> extends infer FlatItem
	? {
			[Field in keyof FlatItem]: Field | `-${Field & string}`;
	  }[keyof FlatItem]
	: never;

/**
 * Deep filter object
 */
export type QueryDeep<Schema extends object, Item> = UnpackList<Item> extends infer FlatItem
	? RelationalFields<Schema, FlatItem> extends never
		? never
		: {
				[Field in RelationalFields<Schema, FlatItem>]?: Query<Schema, FlatItem[Field]> extends infer TQuery
					? MergeObjects<
							QueryDeep<Schema, FlatItem[Field]>,
							{
								[Key in keyof Omit<TQuery, 'deep' | 'alias'> as `_${string & Key}`]: TQuery[Key];
							}
					  >
					: never;
		  }
	: never;

export type MergeObjects<A, B extends object> = A extends object ? A & B : never;

/**
 * Alias object
 *
 * TODO somehow include these aliases in the Field Types!!
 */
export type QueryAlias<_Schema extends object, Item> = Record<string, keyof Item>;
