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
