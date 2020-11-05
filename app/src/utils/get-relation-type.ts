import { Relation } from '@/types';

export function getRelationType(getRelationOptions: {
	relation: Relation;
	collection: string | null;
	field: string;
}): 'm2o' | 'o2m' | 'm2a' | null {
	const { relation, collection, field } = getRelationOptions;

	if (!relation) return null;

	if (
		relation.many_collection === collection &&
		relation.many_field === field &&
		relation.one_collection_field &&
		relation.one_allowed_collections
	) {
		return 'm2a';
	}

	if (relation.many_collection === collection && relation.many_field === field) {
		return 'm2o';
	}

	if (relation.one_collection === collection && relation.one_field === field) {
		return 'o2m';
	}

	return null;
}
