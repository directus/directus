import type { Aggregate, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';

interface ApplyAggregateOptions {
	hasJoins: boolean;
	hasMultiRelationalFilter: boolean;
	hasMultiRelationalSort: boolean;
}

export function applyAggregate(
	schema: SchemaOverview,
	dbQuery: Knex.QueryBuilder,
	aggregate: Aggregate,
	collection: string,
	options: ApplyAggregateOptions,
): void {
	const { hasJoins, hasMultiRelationalFilter, hasMultiRelationalSort } = options;

	// o2m/o2a joins (from a relational filter or sort) multiply rows, so a plain COUNT over-counts.
	// Count distinct primary keys for the "count items" operations, matching the data query's dedup.
	const primaryKey = schema.collections[collection]!.primary;
	const dedupeCount = hasMultiRelationalFilter || hasMultiRelationalSort;

	for (const [operation, fields] of Object.entries(aggregate)) {
		if (!fields) continue;

		if (operation === 'countAll' && dedupeCount) {
			dbQuery.countDistinct(`${collection}.${primaryKey}`, { as: 'countAll' });
			continue;
		}

		if (operation === 'countAll') {
			dbQuery.count('*', { as: 'countAll' });
			continue;
		}

		for (const field of fields) {
			if (operation === 'count' && dedupeCount && field === '*') {
				dbQuery.countDistinct(`${collection}.${primaryKey}`, { as: 'count' });
				continue;
			}

			if (operation === 'count' && dedupeCount && field === primaryKey) {
				// The join duplicates the primary key; count distinct for the true item count.
				dbQuery.countDistinct(`${collection}.${field}`, { as: `count->${field}` });
				continue;
			}

			if (operation === 'count' && field === '*') {
				dbQuery.count('*', { as: 'count' });
				continue;
			}

			if (operation === 'countDistinct' && !hasJoins && schema.collections[collection]?.primary === field) {
				// Optimize to count as primary keys are unique
				dbQuery.count(`${collection}.${field}`, { as: `countDistinct->${field}` });
				continue;
			}

			if (['count', 'countDistinct', 'avg', 'avgDistinct', 'sum', 'sumDistinct', 'min', 'max'].includes(operation)) {
				(dbQuery as any)[operation](`${collection}.${field}`, { as: `${operation}->${field}` });
			}
		}
	}
}
