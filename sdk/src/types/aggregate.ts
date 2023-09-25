import type { AllCollections, GetCollection, ItemType, Query, RelationalFields, UnpackList } from './index.js';

export type GroupingFunctions = {
	date: 'year' | 'month' | 'week' | 'day' | 'weekday' | 'hour' | 'minute' | 'second';
	array: 'count';
};

// strings are used to ensure precision and prevent overflows
export type AggregationTypes = {
	count: {
		output: string | null;
		wildcard: true;
	};
	countDistinct: {
		output: string | null;
		wildcard: true;
	};
	sum: {
		output: string | null;
		wildcard: never;
	};
	sumDistinct: {
		output: string | null;
		wildcard: never;
	};
	avg: {
		output: string | null;
		wildcard: never;
	};
	avgDistinct: {
		output: string | null;
		wildcard: never;
	};
	min: {
		output: number | null;
		wildcard: never;
	};
	max: {
		output: number | null;
		wildcard: never;
	};
};

/**
 * Aggregation parameters
 */
export type AggregateRecord<Fields = string> = {
	[Func in keyof AggregationTypes]?: Fields | (AggregationTypes[Func]['wildcard'] extends never ? never : '*');
};

/**
 * GroupBy parameters
 */
export type GroupByFields<Schema extends object, Item> =
	| WrappedFields<DateFields<Schema, Item>, GroupingFunctions['date']>
	| WrappedFields<RelationalFields<Schema, Item>, GroupingFunctions['array']>;

/**
 * Aggregation input options
 */
export type AggregationOptions<
	Schema extends object,
	Collection extends AllCollections<Schema>,
	Fields = Collection extends keyof Schema ? keyof UnpackList<GetCollection<Schema, Collection>> : string,
	Item = Collection extends keyof Schema ? UnpackList<GetCollection<Schema, Collection>> : object
> = {
	aggregate: AggregateRecord<Fields>;
	groupBy?: (Fields | GroupByFields<Schema, Item>)[];
	query?: Omit<Query<Schema, Item>, 'fields' | 'deep' | 'alias'>;
};

/**
 * Output typing for aggregation
 */
export type AggregationOutput<
	Schema extends object,
	Collection extends AllCollections<Schema>,
	Options extends AggregationOptions<Schema, Collection>
> = ((Options['groupBy'] extends string[]
	? UnpackList<GetCollection<Schema, Collection>> extends infer Item
		? MappedFunctionFields<Schema, Item> extends infer FieldMap
			? MappedFieldNames<Schema, Item> extends infer NamesMap
				? {
						[Field in UnpackList<Options['groupBy']> as TranslateFunctionField<FieldMap, Field>]: ExtractFieldName<
							NamesMap,
							Field
						> extends keyof Item
							? Item[ExtractFieldName<NamesMap, Field>]
							: never;
				  }
				: never
			: never
		: never
	: object) & {
	[Func in keyof Options['aggregate']]: Func extends keyof AggregationTypes
		? Options['aggregate'][Func] extends string
			? Options['aggregate'][Func] extends '*'
				? AggregationTypes[Func]['output']
				: { [Field in Options['aggregate'][Func]]: AggregationTypes[Func]['output'] }
			: never
		: never;
})[];

/**
 * Wrap fields in functions
 */
type WrappedFields<Fields, Funcs> = Fields extends string
	? Funcs extends string
		? `${Funcs}(${Fields})`
		: never
	: never;

/**
 * Try to detect date fields
 * TODO all we can really check is for string types, can we do more?
 */
type DateFields<Schema extends object, Item> = {
	[Key in keyof Item]: Extract<Item[Key], ItemType<Schema>> extends never
		? NonNullable<Item[Key]> extends string
			? Key
			: never
		: never;
}[keyof Item];

/**
 * The types below are helpers for working with fields wrapped in functions
 *
 * TODO this must be doable in a simpler way to handle the logic below!
 */
type PermuteFields<Fields, Funcs> = Fields extends string ? (Funcs extends string ? [Fields, Funcs] : never) : never;

type MapFunctionFields<Fields, Funcs> = {
	[F in PermuteFields<Fields, Funcs> as `${F[1]}(${F[0]})`]: `${F[0]}_${F[1]}`;
};
type MapFieldNames<Fields, Funcs> = {
	[F in PermuteFields<Fields, Funcs> as `${F[1]}(${F[0]})`]: F[0];
};

type MappedFunctionFields<Schema extends object, Item> = MapFunctionFields<
	DateFields<Schema, Item>,
	GroupingFunctions['date']
> &
	MapFunctionFields<RelationalFields<Schema, Item>, GroupingFunctions['array']>;

type MappedFieldNames<Schema extends object, Item> = MapFieldNames<
	DateFields<Schema, Item>,
	GroupingFunctions['date']
> &
	MapFieldNames<RelationalFields<Schema, Item>, GroupingFunctions['array']>;

type TranslateFunctionField<FieldMap, Field> = Field extends keyof FieldMap
	? FieldMap[Field] extends string
		? FieldMap[Field]
		: never
	: Field extends string
	? Field
	: never;

type ExtractFieldName<FieldMap, Field> = Field extends keyof FieldMap
	? FieldMap[Field] extends string
		? FieldMap[Field]
		: never
	: Field extends string
	? Field
	: never;
