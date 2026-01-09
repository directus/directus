import type { Relation, RelationMeta } from '@directus/types';
import { getRelationTypeServer } from './get-relation-type.js';
import { getRelation } from './get-relation.js';

export type RelationInfo = {
	relation: Relation | null;
	relationType: 'o2m' | 'm2o' | 'a2o' | 'o2a' | null;
};

function checkImplicitRelation(field: string) {
	if (field.startsWith('$FOLLOW(') && field.endsWith(')')) {
		return field.slice(8, -1).split(',');
	}

	return null;
}

export function getRelationInfo(relations: Relation[], collection: string, field: string): RelationInfo {
	if (field.startsWith('$FOLLOW') && field.length > 500) {
		throw new Error(`Implicit $FOLLOW statement is too big to parse. Got: "${field.substring(500)}..."`);
	}

	const implicitRelation = checkImplicitRelation(field);

	if (implicitRelation) {
		if (implicitRelation[2] === undefined) {
			const [m2oCollection, m2oField] = implicitRelation;

			const relation: Relation = {
				collection: m2oCollection!.trim(),
				field: m2oField!.trim(),
				related_collection: collection,
				schema: null,
				meta: null,
			};

			return { relation, relationType: 'o2m' };
		} else {
			const [a2oCollection, a2oItemField, a2oCollectionField] = implicitRelation;

			const relation: Relation = {
				collection: a2oCollection!.trim(),
				field: a2oItemField!.trim(),
				related_collection: collection,
				schema: null,
				meta: {
					one_collection_field: a2oCollectionField.trim(),
				} as RelationMeta,
			};

			return { relation, relationType: 'o2a' };
		}
	}

	const relation = getRelation(relations, collection, field) ?? null;
	const relationType = relation ? getRelationTypeServer({ relation, collection, field }) : null;

	return { relation, relationType };
}
