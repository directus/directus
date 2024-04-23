import type { SchemaOverview } from '@directus/types';
import type { CollectionKey, FieldKey } from '../types.js';

export function findRelatedCollection(
	collection: CollectionKey,
	field: FieldKey,
	schema: SchemaOverview,
): CollectionKey | null {
	const relation = schema.relations.find((relation) => {
		return (
			/* m2o */ (relation.collection === collection && relation.field === field) ||
			/* o2m */ (relation.related_collection === collection && relation.meta?.one_field === field)
		);
	});

	if (!relation) return null;

	const isO2m = relation.related_collection === collection;

	const relatedCollectionName = isO2m ? relation.collection : relation.related_collection!;

	return relatedCollectionName;
}
