import type { AllCollections } from '../../../index.js';
import type { AggregationOptions, AggregationOutput } from '../../../types/aggregate.js';
import type { RestCommand } from '../../types.js';

/**
 * Aggregate allow you to perform calculations on a set of values, returning a single result.
 * @param collection The collection to aggregate
 * @param options The aggregation options
 * @returns Aggregated data
 */
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
				...(options.query ?? {}),
				...(options.groupBy ? { groupBy: options.groupBy } : {}),
				aggregate: options.aggregate,
			},
		};
	};
