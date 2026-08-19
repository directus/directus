import type { SchemaOverview } from '@directus/types';
import { getRelation } from '@directus/utils';
import { getRelatedCollection } from './get-related-collection.js';

/**
 * Whether a relational field can be followed into its related collection.
 */
export function isRelationTraversable(schema: SchemaOverview, collection: string, field: string): boolean {
	const relation = getRelation(schema.relations, collection, field);

	if (!relation) return false;

	// An a2o remains traversable for as long as any of its targets is still around
	if (relation.meta?.one_allowed_collections) {
		return relation.meta.one_allowed_collections.some((allowed) => allowed in schema.collections);
	}

	const relatedCollection = getRelatedCollection(schema, collection, field);

	return relatedCollection !== null && relatedCollection in schema.collections;
}
