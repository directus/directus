import type { MappedFieldNames } from './functions.js';
import type { FieldOutputMap } from './output.js';
import type { RelationalFields } from './schema.js';
import type { MergeOptional, UnpackList } from './utils.js';

/**
 * Filters
 */
export type QueryFilter<Schema extends object, Item> = WrapLogicalFilters<NestedQueryFilter<Schema, Item>>;

/**
 * Query filters without logical filters
 */
export type NestedQueryFilter<Schema extends object, Item> = UnpackList<Item> extends infer FlatItem
	? MergeOptional<
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
	: never;

/**
 * Allow for relational filters
 */
export type NestedRelationalFilter<Schema extends object, Item, Field extends keyof Item> =
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
> = {
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
	_regex?: T;
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

export type WrapLogicalFilters<Filters extends object> = MergeOptional<
	{
		[Operator in LogicalFilterOperators]?: WrapLogicalFilters<Filters>[];
	},
	Filters
>;
