import type { Snapshot } from '@directus/types';

/**
 * Renames all collections of a snapshot, including every reference to them in fields and relations.
 * @param snapshot The snapshot to rename the collections of.
 * @param getName Returns the new name for a collection of the snapshot.
 * @returns a copy of the snapshot with renamed collections.
 */
export function renameCollections(snapshot: Snapshot, getName: (collection: string) => string): Snapshot {
	const names = new Map(snapshot.collections.map(({ collection }) => [collection, getName(collection)]));

	// Only rename collections of the snapshot, leaving system collections and empty values untouched
	const rename = <T extends string | null | undefined>(name: T): T => (name && (names.get(name) as T)) || name;

	return {
		...snapshot,
		collections: snapshot.collections.map((collection) => ({
			...collection,
			collection: rename(collection.collection),
			meta: collection.meta && {
				...collection.meta,
				collection: rename(collection.meta.collection),
				group: rename(collection.meta.group),
			},
			schema: collection.schema && { ...collection.schema, name: rename(collection.schema.name) },
		})),
		fields: snapshot.fields.map((field) => ({
			...field,
			collection: rename(field.collection),
			meta: field.meta && { ...field.meta, collection: rename(field.meta.collection) },
			schema: field.schema && {
				...field.schema,
				table: rename(field.schema.table),
				foreign_key_table: rename(field.schema.foreign_key_table),
			},
		})),
		relations: snapshot.relations.map((relation) => ({
			...relation,
			collection: rename(relation.collection),
			related_collection: rename(relation.related_collection),
			meta: relation.meta && {
				...relation.meta,
				many_collection: rename(relation.meta.many_collection),
				one_collection: rename(relation.meta.one_collection),
				one_allowed_collections: relation.meta.one_allowed_collections?.map(rename) ?? null,
			},
			schema: relation.schema && {
				...relation.schema,
				table: rename(relation.schema.table),
				foreign_key_table: rename(relation.schema.foreign_key_table),
				// Keep generated constraint names in sync with the renamed table
				constraint_name:
					relation.schema.constraint_name === `${relation.schema.table}_${relation.schema.column}_foreign`
						? `${rename(relation.schema.table)}_${relation.schema.column}_foreign`
						: relation.schema.constraint_name,
			},
		})),
	};
}
