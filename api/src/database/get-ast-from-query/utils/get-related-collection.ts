import type { Relation, SchemaOverview } from '@directus/types';
import { getRelation } from '@directus/utils';

export function getRelatedCollectionFromRelation(relation: Relation, collection: string, field: string): string | null {
	if (relation.collection === collection && relation.field === field) {
		return relation.related_collection || null;
	}

	if (relation.related_collection === collection && relation.meta?.one_field === field) {
		return relation.collection || null;
	}

	return null;
}

export function getRelatedCollection(schema: SchemaOverview, collection: string, field: string): string | null {
	const relation = getRelation(schema.relations, collection, field);

	if (!relation) return null;

	return getRelatedCollectionFromRelation(relation, collection, field);
}
