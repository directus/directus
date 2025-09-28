import type { FieldFilter, Filter, LogicalFilterAND, LogicalFilterOR, SchemaOverview } from '@directus/types';
import { getRelationInfo } from './get-relation-info.js';

export function dedupeFilter(filter: Filter | null | undefined, collection: string, schema: SchemaOverview): Filter | FieldFilter | null {
	if (!filter || typeof filter !== 'object') {
		return null;
	}

	// Handle logical operators (_and, _or)
	if ('_and' in filter) {
		const andFilter = filter as LogicalFilterAND;
		return {
			_and: andFilter._and.map((subFilter: Filter) => dedupeFilter(subFilter, collection, schema) as FieldFilter),
		};
	}

	if ('_or' in filter) {
		const orFilter = filter as LogicalFilterOR;
		return {
			_or: orFilter._or.map((subFilter: Filter) => dedupeFilter(subFilter, collection, schema) as FieldFilter),
		};
	}

	// Process field filters
	const result: FieldFilter = {};

	for (const [key, value] of Object.entries(filter)) {
		// Skip operators that start with underscore
		if (key.startsWith('_')) {
			(result as any)[key] = value;
			continue;
		}

		// Get relation info for this field
		const { relation, relationType } = getRelationInfo(schema.relations, collection, key);

		// If this is a relation field, check if we can optimize it
		if (relation && relationType === 'm2o') {
			const relatedCollection = relation.related_collection!;
			const relatedPk = schema.collections[relatedCollection]?.primary;

			// Check if the value is a filter object and contains the primary key field
			if (value && typeof value === 'object' && !Array.isArray(value) && relatedPk) {
				// Check if the filter contains the primary key field
				if (relatedPk in (value as any)) {
					// Extract the primary key filter
					const pkFilter = (value as any)[relatedPk];

					// If it's a simple operator (not nested), we can optimize
					if (pkFilter && typeof pkFilter === 'object' && !Array.isArray(pkFilter)) {
						const hasOnlyOperators = Object.keys(pkFilter).every((k) => k.startsWith('_'));

						if (hasOnlyOperators) {
							// Replace the relation filter with the primary key filter directly
							(result as any)[key] = pkFilter;
							continue;
						}
					}
				}
			}

			// If we couldn't optimize, recursively process the nested filter
			if (value && typeof value === 'object' && !Array.isArray(value)) {
				(result as any)[key] = dedupeFilter(value as Filter, relatedCollection, schema);
			} else {
				(result as any)[key] = value;
			}
		} else if (relation && (relationType === 'o2m' || relationType === 'o2a')) {
			// For o2m/o2a relations, process the nested filter
			if (value && typeof value === 'object' && !Array.isArray(value)) {
				(result as any)[key] = dedupeFilter(value as Filter, relation.collection, schema);
			} else {
				(result as any)[key] = value;
			}
		} else {
			// Not a relation field, keep as is
			(result as any)[key] = value;
		}
	}

	return result;
}
