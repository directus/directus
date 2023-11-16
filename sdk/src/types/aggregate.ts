import type { ArrayFunctions, DateTimeFunctions, MappedFieldNames, MappedFunctionFields } from './functions.js';
import type { AllCollections, GetCollection, LiteralFields, Query, RelationalFields, UnpackList } from './index.js';

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
	[Func in keyof AggregationTypes]?:
		| Fields
		| Fields[]
		| (AggregationTypes[Func]['wildcard'] extends never ? never : '*');
};

/**
 * GroupBy parameters
 */
export type GroupByFields<Schema extends object, Item> =
	| WrappedFields<LiteralFields<Item, 'datetime'>, DateTimeFunctions>
	| WrappedFields<RelationalFields<Schema, Item>, ArrayFunctions>;

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
		? Item extends object
			? MappedFunctionFields<Schema, Item> extends infer FieldMap
				? MappedFieldNames<Schema, Item> extends infer NamesMap
					? {
							[Field in UnpackList<Options['groupBy']> as TranslateFunctionField<
								FieldMap,
								Field
							>]: TranslateFunctionField<NamesMap, Field> extends keyof Item
								? Item[TranslateFunctionField<NamesMap, Field>]
								: never;
					  }
					: never
				: never
			: never
		: never
	: object) & {
	[Func in keyof Options['aggregate']]: Func extends keyof AggregationTypes
		? Options['aggregate'][Func] extends string[]
			? {
					[Field in UnpackList<Options['aggregate'][Func]>]: Field extends '*'
						? AggregationTypes[Func]['output']
						: { [SubField in Field]: AggregationTypes[Func]['output'] }[Field];
			  }
			: Options['aggregate'][Func] extends string
			? Options['aggregate'][Func] extends '*'
				? AggregationTypes[Func]['output']
				: { [SubField in Options['aggregate'][Func]]: AggregationTypes[Func]['output'] }[Options['aggregate'][Func]]
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
 * Translate function names based on provided map
 */
type TranslateFunctionField<FieldMap, Field> = Field extends keyof FieldMap
	? FieldMap[Field] extends string
		? FieldMap[Field]
		: never
	: Field extends string
	? Field
	: never;
