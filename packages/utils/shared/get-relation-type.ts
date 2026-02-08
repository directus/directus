import type { Relation } from '@directus/types';

type GetRelationOptions = {
	relation: Relation;
	collection: string | null;
	field: string;
};

export function getRelationType(options: GetRelationOptions & { useA2O: true }): 'm2o' | 'o2m' | 'a2o' | null;
export function getRelationType(options: GetRelationOptions & { useA2O?: false }): 'm2o' | 'o2m' | 'm2a' | null;
export function getRelationType(
	getRelationOptions: GetRelationOptions & { useA2O?: boolean },
): 'm2o' | 'o2m' | 'm2a' | 'a2o' | null {
	const { relation, collection, field, useA2O = false } = getRelationOptions;

	if (!relation) return null;

	if (
		relation.collection === collection &&
		relation.field === field &&
		relation.meta?.one_collection_field &&
		relation.meta?.one_allowed_collections
	) {
		return useA2O ? 'a2o' : 'm2a';
	}

	if (relation.collection === collection && relation.field === field) {
		return 'm2o';
	}

	if (relation.related_collection === collection && relation.meta?.one_field === field) {
		return 'o2m';
	}

	return null;
}
