import type { Aggregate, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';

export function applyAggregate(
	schema: SchemaOverview,
	dbQuery: Knex.QueryBuilder,
	aggregate: Aggregate,
	collection: string,
	hasJoins: boolean,
): void {
	for (const [operation, fields] of Object.entries(aggregate)) {
		if (!fields) continue;

		for (const field of fields) {
			if (operation === 'avg') {
				dbQuery.avg(`${collection}.${field}`, { as: `avg->${field}` });
			}

			if (operation === 'avgDistinct') {
				dbQuery.avgDistinct(`${collection}.${field}`, { as: `avgDistinct->${field}` });
			}

			if (operation === 'countAll') {
				dbQuery.count('*', { as: 'countAll' });
			}

			if (operation === 'count') {
				if (field === '*') {
					dbQuery.count('*', { as: 'count' });
				} else {
					dbQuery.count(`${collection}.${field}`, { as: `count->${field}` });
				}
			}

			if (operation === 'countDistinct') {
				if (!hasJoins && schema.collections[collection]?.primary === field) {
					// Optimize to count as primary keys are unique
					dbQuery.count(`${collection}.${field}`, { as: `countDistinct->${field}` });
				} else {
					dbQuery.countDistinct(`${collection}.${field}`, { as: `countDistinct->${field}` });
				}
			}

			if (operation === 'sum') {
				dbQuery.sum(`${collection}.${field}`, { as: `sum->${field}` });
			}

			if (operation === 'sumDistinct') {
				dbQuery.sumDistinct(`${collection}.${field}`, { as: `sumDistinct->${field}` });
			}

			if (operation === 'min') {
				dbQuery.min(`${collection}.${field}`, { as: `min->${field}` });
			}

			if (operation === 'max') {
				dbQuery.max(`${collection}.${field}`, { as: `max->${field}` });
			}
		}
	}
}
