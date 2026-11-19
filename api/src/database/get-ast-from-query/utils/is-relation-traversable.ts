import type { Relation, SchemaOverview } from '@directus/types';
import { getRelationInfo, isCollectionActive } from '@directus/utils';

/**
 * Whether a relational field can be followed into its related collection.
 */
export function isRelationTraversable(
	schema: SchemaOverview,
	collection: string,
	field: string,
	knownRelation?: Relation,
): boolean {
	const relationInfo = getRelationInfo(knownRelation ? [knownRelation] : schema.relations, collection, field);
	const relation = relationInfo.relation;

	if (!relation) return false;

	// An a2o remains traversable for as long as any of its targets is still around
	if (relation.meta?.one_allowed_collections) {
		return relation.meta.one_allowed_collections.some((allowed) => isCollectionActive(schema.collections[allowed]));
	}

	const relatedCollection = relationInfo.oppositeCollection;

	return relatedCollection !== null && isCollectionActive(schema.collections[relatedCollection]);
}
