import type { SchemaOverview } from '@directus/types';
import type { Relation } from '@directus/types';

export function getRelations(relations: Relation[], collection: string, field: string): Relation[] {
	const relation = relations.filter((relation) => {
		return (
			(relation.collection === collection && relation.field === field) ||
			(relation.related_collection === collection && relation.meta?.one_field === field)
		);
	});

	return relation;
}

export function getRelation(relations: Relation[], collection: string, field: string): Relation | undefined {
	const relation = relations.find((relation) => {
		return (
			(relation.collection === collection && relation.field === field) ||
			(relation.related_collection === collection && relation.meta?.one_field === field)
		);
	});

	return relation;
}

export function getRelationsForCollection(schema: SchemaOverview, collection: string) {
	const fields = schema.collections[collection]?.fields;

	const relationalFields = [];

	if (!fields) return [];

	for (const relation of schema.relations) {
		if (relation.collection === collection && fields?.[relation.field]) {
			relationalFields.push(relation.field);
		} else if (
			relation.related_collection === collection &&
			relation.meta?.one_field &&
			fields?.[relation.meta.one_field]
		) {
			relationalFields.push(relation.meta.one_field);
		}
	}

	return relationalFields;
}
