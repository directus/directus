import type { Relation, SchemaOverview } from '@directus/types';
import { getRelation, isCollectionActive } from '@directus/utils';
import { getRelatedCollectionFromRelation } from './get-related-collection.js';

/**
 * Whether a relational field can be followed into its related collection.
 */
export function isRelationTraversable(
	schema: SchemaOverview,
	collection: string,
	field: string,
	knownRelation?: Relation,
): boolean {
	const relation = knownRelation ?? getRelation(schema.relations, collection, field);

	if (!relation) return false;

	// An a2o remains traversable for as long as any of its targets is still around
	if (relation.meta?.one_allowed_collections) {
		return relation.meta.one_allowed_collections.some((allowed) => isCollectionActive(schema.collections[allowed]));
	}

	const relatedCollection = getRelatedCollectionFromRelation(relation, collection, field);

	return relatedCollection !== null && isCollectionActive(schema.collections[relatedCollection]);
}
