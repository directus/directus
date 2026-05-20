import type { Relation, SchemaOverview } from '@directus/types';

export function getSchemaOverview(input: {
	collections: Array<{ collection: string; meta?: { singleton?: boolean | null } | null }>;
	relations: Relation[];
	getPrimaryKeyFieldForCollection: (collection: string) => { field: string } | null | undefined;
}): SchemaOverview {
	const collections = Object.fromEntries(
		input.collections.map((collection) => {
			const primary = input.getPrimaryKeyFieldForCollection(collection.collection)?.field ?? 'id';

			return [
				collection.collection,
				{
					collection: collection.collection,
					primary,
					singleton: collection.meta?.singleton ?? false,
					sortField: null,
					note: null,
					accountability: null,
					fields: {},
				},
			];
		}),
	);

	return {
		collections,
		relations: input.relations,
	} as unknown as SchemaOverview;
}
