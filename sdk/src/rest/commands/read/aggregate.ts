import type { AllCollections } from '../../../index.js';
import { throwIfEmpty } from '../../utils/index.js';
import type { AggregationOptions, AggregationOutput } from '../../../types/aggregate.js';
import type { RestCommand } from '../../types.js';

/**
 * Aggregate allow you to perform calculations on a set of values, returning a single result.
 * @param collection The collection to aggregate
 * @param options The aggregation options
 * @returns Aggregated data
 * @throws Will throw if collection is empty
 */
export const aggregate =
	<
		Schema extends object,
		Collection extends AllCollections<Schema>,
		Options extends AggregationOptions<Schema, Collection>,
	>(
		collection: Collection,
		options: Options,
	): RestCommand<AggregationOutput<Schema, Collection, Options>, Schema> =>
	() => {
		const collectionName = String(collection);
		throwIfEmpty(collectionName, 'Collection cannot be empty');

		const path = collectionName.startsWith('directus_')
			? `/${collectionName.substring(9)}`
			: `/items/${collectionName}`;

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
