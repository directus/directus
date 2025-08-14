import type { Relation } from '@directus/types';
import { getRelation, getRelationType } from '@directus/utils';

export function getRelationInfo(relations: Relation[], collection: string, field: string) {
	const relation = getRelation(relations, collection, field) ?? null;
	if (!relation) return undefined;

	const relationType = getRelationType({ relation, collection, field })!;

	return { relation, relationType };
}
