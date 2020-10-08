import { Relation } from '../types';

export function getRelationType(
	relation: Relation,
	collection: string,
	field: string
): 'm2o' | 'o2m' | 'm2a' | null {
	if (
		relation.many_collection === collection &&
		relation.many_field === field &&
		relation.one_collection_field !== null
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
