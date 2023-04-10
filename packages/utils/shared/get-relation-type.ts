import type { Relation } from '@directus/types';

export function getRelationType(getRelationOptions: {
	relation: Relation;
	collection: string | null;
	field: string;
}): 'm2o' | 'o2m' | 'm2a' | null {
	const { relation, collection, field } = getRelationOptions;

	if (!relation) return null;

	if (
		relation.collection === collection &&
		relation.field === field &&
		relation.meta?.one_collection_field &&
		relation.meta?.one_allowed_collections
	) {
		return 'm2a';
	}

	if (relation.collection === collection && relation.field === field) {
		return 'm2o';
	}

	if (relation.related_collection === collection && relation.meta?.one_field === field) {
		return 'o2m';
	}

	return null;
}
