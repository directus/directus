import type { SchemaOverview } from '@directus/types';

export function getRelation(schema: SchemaOverview, collection: string, field: string) {
	const relation = schema.relations.find((relation) => {
		return (
			(relation.collection === collection && relation.field === field) ||
			(relation.related_collection === collection && relation.meta?.one_field === field)
		);
	});

	return relation;
}
