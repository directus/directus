import type {
	Collection,
	CollectionMeta,
	CollectionOverview,
	Field,
	FieldMeta,
	FieldOverview,
	Relation,
	SchemaOverview,
	Snapshot,
} from '@directus/types';

const ALIAS_TYPES = ['alias', 'o2m', 'm2m', 'm2a', 'o2a', 'files', 'translations'];

export type SchemaSnapshot = {
	collections: (Collection | Snapshot['collections'][number])[];
	fields: (Field | Snapshot['fields'][number])[];
	relations: (Relation | Snapshot['relations'][number])[];
};

/**
 * Converts collections, fields and relations (e.g. a schema snapshot) into a SchemaOverview,
 * mirroring how the API derives the overview from the database in `getSchema`.
 */
export function toSchemaOverview(snapshot: SchemaSnapshot): SchemaOverview {
	const schema: SchemaOverview = {
		collections: {},
		relations: [],
	};

	// Index fields once, so collections don't rescan the whole snapshot
	const fieldsByCollection = new Map<string, SchemaSnapshot['fields']>();

	for (const field of snapshot.fields) {
		const fields = fieldsByCollection.get(field.collection) ?? [];
		fields.push(field);
		fieldsByCollection.set(field.collection, fields);
	}

	for (const collection of snapshot.collections) {
		// Folders have no table and therefore no place in the overview
		if (!collection.schema) continue;

		const meta = collection.meta as Partial<CollectionMeta> | null;
		const fields = fieldsByCollection.get(collection.collection) ?? [];
		const primary = fields.find((field) => field.schema?.is_primary_key)?.field;

		if (!primary) continue;

		const overview: CollectionOverview = {
			collection: collection.collection,
			primary,
			singleton: meta?.singleton ?? false,
			note: meta?.note || null,
			sortField: meta?.sort_field || null,
			accountability: meta ? (meta.accountability ?? null) : 'all',
			status: meta?.status ?? 'active',
			fields: {},
		};

		for (const field of fields) {
			const fieldOverview = toFieldOverview(field);
			if (fieldOverview) overview.fields[field.field] = fieldOverview;
		}

		schema.collections[collection.collection] = overview;
	}

	schema.relations = snapshot.relations.map((relation, index) => {
		if (!relation.meta || relation.meta.id !== undefined) return relation;

		// Snapshots strip relation ids, so derive a stable one from the position
		return { ...relation, meta: { ...relation.meta, id: index } };
	});

	return schema;
}

function toFieldOverview(field: SchemaSnapshot['fields'][number]): FieldOverview | null {
	const column = field.schema;
	let meta = field.meta as Partial<FieldMeta> | null;

	// The API ignores the meta of `no-data` fields, only keeping their column if present
	if (meta?.special?.includes('no-data')) meta = null;

	const special = meta?.special ?? [];

	if (!column && ALIAS_TYPES.some((type) => special.includes(type)) === false) return null;

	return {
		field: field.field,
		defaultValue: column?.has_auto_increment ? 'AUTO_INCREMENT' : (column?.default_value ?? null),
		nullable: column?.is_nullable ?? true,
		generated: column?.is_generated ?? false,
		type: column ? field.type : 'alias',
		dbType: column?.data_type ?? null,
		precision: column?.numeric_precision || null,
		scale: column?.numeric_scale || null,
		special,
		note: meta?.note ?? null,
		validation: meta?.validation ?? null,
		alias: !column,
		searchable: meta?.searchable ?? true,
	};
}
