import type { SchemaOverview } from '@directus/types';
import { getRelationInfo } from '@directus/utils';
import type { CollectionKey, FieldKey } from '../types.js';

export function findRelatedCollection(
	collection: CollectionKey,
	field: FieldKey,
	schema: SchemaOverview,
): CollectionKey | null {
	const { relation } = getRelationInfo(schema.relations, collection, field);

	if (!relation) return null;

	const isO2m = relation.related_collection === collection;

	const relatedCollectionName = isO2m ? relation.collection : relation.related_collection!;

	return relatedCollectionName;
}
