import type { MappedFieldNames } from './functions.js';
import type { FieldOutputMap } from './output.js';
import type { RelationalFields } from './schema.js';
import type { IfNever, IsDateTime, IsNumber, IsString, Merge, UnpackList } from './utils.js';

/**
 * Filters
 */
export type QueryFilter<Schema, Item> = WrapLogicalFilters<NestedQueryFilter<Schema, Item>>;

/**
 * Query filters without logical filters
 */
export type NestedQueryFilter<Schema, Item> =
	UnpackList<Item> extends infer FlatItem
		? Partial<
				Merge<
					{
						[Field in keyof FlatItem]?: NestedRelationalFilter<Schema, FlatItem, Field>;
					},
					MappedFieldNames<Schema, Item> extends infer Funcs
						? {
								[Func in keyof Funcs]?: Funcs[Func] extends infer Field
									? Field extends keyof FlatItem
										? NestedRelationalFilter<Schema, FlatItem, Field>
										: never
									: never;
							}
						: never
				>
			>
		: never;

/**
 * Allow for relational filters
 */
export type NestedRelationalFilter<Schema, Item, Field extends keyof Item> =
	| (Field extends RelationalFields<Schema, Item>
			? WrapRelationalFilters<NestedQueryFilter<Schema, Item[Field]>>
			: never)
	| FilterOperators<Item[Field]>;

/**
 * All regular filter operators
 *
 * TODO would love to filter this based on field type but thats not accurate enough in the schema atm
 */
export type FilterOperators<
	FieldType,
	T = FieldType extends keyof FieldOutputMap ? FieldOutputMap[FieldType] : FieldType,
> = MapFilterOperators<{
	_eq: T;
	_neq: T;
	_gt: IsDateTime<FieldType, string, IsNumber<T, number, never>>;
	_gte: IsDateTime<FieldType, string, IsNumber<T, number, never>>;
	_lt: IsDateTime<FieldType, string, IsNumber<T, number, never>>;
	_lte: IsDateTime<FieldType, string, IsNumber<T, number, never>>;
	_in: T[];
	_nin: T[];
	_between: IsDateTime<FieldType, [T, T], IsNumber<T, [T, T], never>>;
	_nbetween: IsDateTime<FieldType, [T, T], IsNumber<T, [T, T], never>>;
	_contains: IsDateTime<FieldType, never, IsString<T, string, never>>;
	_ncontains: IsDateTime<FieldType, never, IsString<T, string, never>>;
	_icontains: IsDateTime<FieldType, never, IsString<T, string, never>>;
	_starts_with: IsDateTime<FieldType, never, IsString<T, string, never>>;
	_istarts_with: IsDateTime<FieldType, never, IsString<T, string, never>>;
	_nstarts_with: IsDateTime<FieldType, never, IsString<T, string, never>>;
	_nistarts_with: IsDateTime<FieldType, never, IsString<T, string, never>>;
	_ends_with: IsDateTime<FieldType, never, IsString<T, string, never>>;
	_iends_with: IsDateTime<FieldType, never, IsString<T, string, never>>;
	_nends_with: IsDateTime<FieldType, never, IsString<T, string, never>>;
	_niends_with: IsDateTime<FieldType, never, IsString<T, string, never>>;
	_empty: boolean;
	_nempty: boolean;
	_nnull: boolean;
	_null: boolean;
	_intersects: T;
	_nintersects: T;
	_intersects_bbox: T;
	_nintersects_bbox: T;
	// regex is not available over the API https://docs.directus.io/reference/filter-rules.html#filter-operators
	// _regex: IsDateTime<FieldType, never, IsString<T, string, never>>;
}>;

// filter not applicable filters based on "never" types
type MapFilterOperators<Filters extends object> = {
	[Key in keyof Filters as IfNever<Filters[Key], never, Key>]?: Filters[Key];
};

/**
 * Relational filter operators
 */
export type RelationalFilterOperators = '_some' | '_none';

export type WrapRelationalFilters<Filters> =
	| {
			[Operator in RelationalFilterOperators]?: Filters;
	  }
	| Filters;

/**
 * Logical filter operations
 */
export type LogicalFilterOperators = '_or' | '_and';

export type WrapLogicalFilters<Filters extends object> =
	| {
			[Operator in LogicalFilterOperators]?: WrapLogicalFilters<Filters>[];
	  }
	| Filters;
