import type { CoreSchema, Query, RegularCollections, UnpackList } from '../../../index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type AGGREGATION_FUNCTIONS =
	| 'count'
	| 'countDistinct'
	| 'sum'
	| 'sumDistinct'
	| 'avg'
	| 'avgDistinct'
	| 'min'
	| 'max';

export type NumberAsString = string; // strings are used to ensure precision and prevent overflows

type AllCollections<Schema extends object> = RegularCollections<Schema> | RegularCollections<CoreSchema<Schema>>;

type GetCollection<
	Schema extends object,
	Collection extends AllCollections<Schema>
> = Collection extends keyof CoreSchema<Schema>
	? CoreSchema<Schema>[Collection]
	: Collection extends keyof Schema
	? Schema[Collection]
	: never;

export type WrappedFields<Fields, Funcs> = Fields extends string
	? Funcs extends string
		? `${Funcs}(${Fields})`
		: never
	: never;

export type AggregationOptions<
	Schema extends object,
	Collection extends AllCollections<Schema>,
	Fields = Collection extends keyof Schema ? keyof UnpackList<GetCollection<Schema, Collection>> : string,
	Item = Collection extends keyof Schema ? UnpackList<GetCollection<Schema, Collection>> : object
> = {
	aggregate: Partial<Record<AGGREGATION_FUNCTIONS, Fields | '*'>>;
	groupBy?: (Fields | WrappedFields<Fields, AGGREGATION_FUNCTIONS>)[];
	query?: Omit<Query<Schema, Item>, 'fields' | 'deep' | 'alias'>;
};

export type AggregationOutput<
	Schema extends object,
	Collection extends AllCollections<Schema>,
	Options extends AggregationOptions<Schema, Collection>
> = {
	[Func in keyof Options['aggregate']]: Options['aggregate'][Func] extends string
		? Options['aggregate'][Func] extends '*'
			? NumberAsString
			: { [Field in Options['aggregate'][Func]]: NumberAsString }
		: never;
}[];

export const aggregate =
	<
		Schema extends object,
		Collection extends AllCollections<Schema>,
		Options extends AggregationOptions<Schema, Collection>
	>(
		collection: Collection,
		options: Options
	): RestCommand<AggregationOutput<Schema, Collection, Options>, Schema> =>
	() => {
		const _collection = collection as string;

		const path = _collection.startsWith('directus_') ? `/${_collection.substring(9)}` : `/items/${_collection}`;

		return {
			path,
			method: 'GET',
			params: {
				...(options.query ? queryToParams(options.query) : {}),
				...(options.groupBy ? { groupBy: options.groupBy } : {}),
				aggregate: options.aggregate,
			},
		};
	};
