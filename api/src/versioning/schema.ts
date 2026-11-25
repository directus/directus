import type { CollectionOverview, CollectionsOverview, FieldOverview, Relation, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { partition, uniq } from 'lodash-es';
import { getHelpers } from '../database/helpers/index.js';
import {
	VERSION_REFERENCE_PREFIX,
	VERSION_SYSTEM_FIELDS,
	VERSIONED_KEY_FIELD,
} from '../services/version-tables/constants.js';
import { isVersioningTable } from '../services/version-tables/utils.js';
import type { A2OReference, VersionedNode } from '../types/ast.js';

type ReadFields = 'name' | 'shadow' | 'link' | 'versionFields' | 'a2oReferences';

/**
 * Move the shadow and link tables of the schema to `versioning`, which keeps them out of everything that lists the
 * collections of the project, and add the read collection of every collection there
 */
export function extractVersioning(knex: Knex, schema: SchemaOverview): SchemaOverview {
	const collections: CollectionsOverview = {};
	const tables: CollectionsOverview = {};

	for (const [name, collection] of Object.entries(schema.collections)) {
		if (isVersioningTable(name)) tables[name] = collection;
		else collections[name] = collection;
	}

	const [tableRelations, relations] = partition(
		schema.relations,
		(relation) => isVersioningTable(relation.collection) || isVersioningTable(relation.related_collection ?? ''),
	);

	const result: SchemaOverview = {
		collections,
		relations,
		versioning: { collections: tables, relations: tableRelations, readCollections: {}, readRelations: [] },
	};

	const merged = getVersionTablesSchema(result);
	const versioning = result.versioning!;

	for (const collection of Object.keys(collections)) {
		const read = getVersionedRead(knex, merged, collection);
		const { readCollection, readRelations } = createReadCollection(merged, collection, read);

		versioning.readCollections[read.name] = readCollection;
		versioning.readRelations.push(...readRelations);
	}

	return result;
}

const tableSchemas = new WeakMap<SchemaOverview, SchemaOverview>();
const mergedSchemas = new WeakSet<SchemaOverview>();

/**
 * The schema with the shadow and link tables as collections, for reading and writing them directly
 */
export function getVersionTablesSchema(schema: SchemaOverview): SchemaOverview {
	if (!schema.versioning || mergedSchemas.has(schema)) return schema;

	let merged = tableSchemas.get(schema);

	if (!merged) {
		merged = {
			collections: { ...schema.collections, ...schema.versioning.collections },
			relations: [...schema.relations, ...schema.versioning.relations],
			versioning: schema.versioning,
		};

		tableSchemas.set(schema, merged);
		mergedSchemas.add(merged);
	}

	return merged;
}

/**
 * How the collection is read together with its versions: through a collection of its own name and primary key, as the
 * live primary key isn't unique across the live items and versions. Kept on the versioned nodes of the AST.
 */
export function getVersionedRead(
	knex: Knex,
	schema: SchemaOverview,
	collection: string,
): Pick<VersionedNode, ReadFields> {
	const { versioning: helper } = getHelpers(knex);
	const tables = getVersionTablesSchema(schema);

	const name = helper.getVersionedReadName(collection);
	const shadowTable = helper.getShadowTableName(collection);
	const linkTable = helper.getLinkTableName(collection);

	const { primary } = tables.collections[collection]!;
	const shadow = tables.versioning?.collections[shadowTable];
	const link = tables.versioning?.collections[linkTable];

	const systemFields: string[] = Object.values(VERSION_SYSTEM_FIELDS);
	const linkedFields = link ? Object.keys(link.fields).filter((field) => field !== primary) : [];

	const referenceFields = uniq([
		...Object.keys(shadow?.fields ?? {}).filter((field) => field.startsWith(VERSION_REFERENCE_PREFIX)),
		...linkedFields,
	]);

	const a2oReferences = tables.relations.flatMap((relation): A2OReference[] => {
		const allowed = relation.meta?.one_allowed_collections;

		if (relation.collection !== collection || relation.related_collection || !allowed) return [];

		const reference = helper.getVersionReferenceField(relation.field);

		if (!referenceFields.includes(reference)) return [];

		return allowed.flatMap((related) => {
			const relatedShadow = helper.getShadowTableName(related);

			if (!tables.collections[relatedShadow]) return [];

			return [
				{
					column: helper.getA2OVersionReferenceField(relation.field, related),
					reference,
					collectionField: relation.meta!.one_collection_field!,
					collection: related,
					shadow: relatedShadow,
				},
			];
		});
	});

	return {
		name,
		shadow: shadow ? shadowTable : null,
		link: link ? linkTable : null,
		versionFields: [...systemFields, ...referenceFields],
		a2oReferences,
	};
}

const readSchemas = new WeakMap<SchemaOverview, SchemaOverview>();
const builtReadSchemas = new WeakSet<SchemaOverview>();

/**
 * The schema with the shadow and link tables, and the read collections with their relations, for reading the live
 * items of collections together with their versions. The relations of the read collections follow the ones of the
 * project, so lookups that match both find the relation of the live collection first.
 */
export function getVersionedReadSchema(schema: SchemaOverview): SchemaOverview {
	if (builtReadSchemas.has(schema)) return schema;

	const tables = getVersionTablesSchema(schema);

	if (!tables.versioning) return tables;

	let readSchema = readSchemas.get(tables);

	if (!readSchema) {
		const { readCollections, readRelations } = tables.versioning;

		readSchema = {
			collections: { ...tables.collections, ...readCollections },
			relations: [...tables.relations, ...readRelations],
			versioning: tables.versioning,
		};

		readSchemas.set(tables, readSchema);
		mergedSchemas.add(readSchema);
		builtReadSchemas.add(readSchema);
	}

	return readSchema;
}

/**
 * The read collection of a collection, with the version fields and the key of the combined rows, and its relations
 *
 * @param schema - The schema with the shadow and link tables as collections
 */
function createReadCollection(schema: SchemaOverview, collection: string, read: Pick<VersionedNode, ReadFields>) {
	const live = schema.collections[collection]!;
	const { primary } = live;
	const shadow = read.shadow ? schema.collections[read.shadow] : undefined;
	const link = read.link ? schema.collections[read.link] : undefined;
	const isNumericKey = ['integer', 'bigInteger'].includes(live.fields[primary]?.type ?? '');

	const versionField = (field: string): FieldOverview => {
		const base = shadow?.fields[field] ?? link?.fields[field] ?? shadow?.fields[VERSION_SYSTEM_FIELDS.id];

		return base
			? { ...base, field }
			: { ...live.fields[primary]!, field, type: 'string', special: [], defaultValue: null, nullable: true };
	};

	const fields: Record<string, FieldOverview> = {
		...live.fields,
		...Object.fromEntries(read.versionFields.map((field) => [field, versionField(field)])),
		[VERSIONED_KEY_FIELD]: {
			...live.fields[primary]!,
			field: VERSIONED_KEY_FIELD,
			type: isNumericKey ? live.fields[primary]!.type : 'string',
			special: [],
			defaultValue: null,
		},
	};

	for (const { column, reference } of read.a2oReferences) {
		fields[column] = { ...fields[reference]!, field: column };
	}

	// Relations of the live collection apply to the read collection as well, the references to versions of related
	// items come from the shadow table
	const readRelations = schema.relations.flatMap((relation): Relation[] => [
		...(relation.collection === collection ||
		(relation.collection === read.shadow && relation.field.startsWith(VERSION_REFERENCE_PREFIX))
			? [{ ...relation, collection: read.name }]
			: []),
		...(relation.related_collection === collection ? [{ ...relation, related_collection: read.name }] : []),
	]);

	for (const { column, shadow } of read.a2oReferences) {
		readRelations.push({ collection: read.name, field: column, related_collection: shadow, schema: null, meta: null });
	}

	const readCollection: CollectionOverview = {
		...live,
		collection: read.name,
		primary: VERSIONED_KEY_FIELD,
		fields,
	};

	return { readCollection, readRelations };
}
