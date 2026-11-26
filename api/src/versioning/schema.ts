import type {
	CollectionVersioning,
	FieldOverview,
	Relation,
	SchemaOverview,
	VersionedA2OReference,
} from '@directus/types';
import type { Knex } from 'knex';
import { partition, pick, uniq } from 'lodash-es';
import { getHelpers } from '../database/helpers/index.js';
import {
	VERSION_REFERENCE_PREFIX,
	VERSION_SYSTEM_FIELDS,
	VERSIONED_KEY_FIELD,
} from '../services/version-tables/constants.js';
import { isVersioningTable } from '../services/version-tables/utils.js';

/**
 * Move the shadow and link tables of the schema to the versioning of their collection, which keeps them out
 * of everything that lists the collections of the project. Version tables without their live collection are dropped.
 */
export function extractVersioning(knex: Knex, schema: SchemaOverview): SchemaOverview {
	const collectionNames = Object.keys(schema.collections).filter((name) => !isVersioningTable(name));

	const [tableRelations, relations] = partition(
		schema.relations,
		(relation) => isVersioningTable(relation.collection) || isVersioningTable(relation.related_collection ?? ''),
	);

	const { versioning: helper } = getHelpers(knex);

	const versioning = Object.fromEntries(
		collectionNames.map((collection) => [
			collection,
			createCollectionVersioning(helper, schema, collection, tableRelations),
		]),
	);

	return {
		collections: pick(schema.collections, collectionNames),
		relations,
		versioning,
	};
}

type VersioningHelper = ReturnType<typeof getHelpers>['versioning'];

const tableSchemas = new WeakMap<SchemaOverview, SchemaOverview>();
const mergedSchemas = new WeakSet<SchemaOverview>();

/**
 * The schema with the shadow and link tables as collections, for reading and writing them directly
 */
export function getVersionTablesSchema(schema: SchemaOverview): SchemaOverview {
	if (!schema.versioning || mergedSchemas.has(schema)) return schema;

	let merged = tableSchemas.get(schema);

	if (!merged) {
		const reads = Object.values(schema.versioning);
		const tables = reads.flatMap((read) => [read.shadow, read.link]).filter((table) => table !== null);

		merged = {
			collections: {
				...schema.collections,
				...Object.fromEntries(tables.map((table) => [table.collection, table])),
			},
			relations: [...schema.relations, ...reads.flatMap((read) => read.tableRelations)],
			versioning: schema.versioning,
		};

		tableSchemas.set(schema, merged);
		mergedSchemas.add(merged);
	}

	return merged;
}

/**
 * Versioning of the collection, see `CollectionVersioning`
 */
export function getCollectionVersioning(schema: SchemaOverview, collection: string): CollectionVersioning {
	const versioning = schema.versioning?.[collection];

	if (!versioning) throw new Error(`Collection "${collection}" can't be read with versions`);

	return versioning;
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
		const reads = Object.values(tables.versioning);

		readSchema = {
			collections: {
				...tables.collections,
				...Object.fromEntries(reads.map((read) => [read.collection.collection, read.collection])),
			},
			relations: [...tables.relations, ...reads.flatMap((read) => read.relations)],
			versioning: tables.versioning,
		};

		readSchemas.set(tables, readSchema);
		mergedSchemas.add(readSchema);
		builtReadSchemas.add(readSchema);
	}

	return readSchema;
}

/**
 * Versioning of the collection: its shadow and link tables with their relations, and the read collection with its
 * version fields, the key of the combined rows and its relations
 *
 * @param schema - The schema with the shadow and link tables as collections
 * @param tableRelations - Relations of the shadow and link tables of all collections
 */
function createCollectionVersioning(
	helper: VersioningHelper,
	schema: SchemaOverview,
	collection: string,
	tableRelations: Relation[],
): CollectionVersioning {
	const name = helper.getVersionedReadName(collection);
	const live = schema.collections[collection]!;
	const { primary } = live;
	const shadow = schema.collections[helper.getShadowTableName(collection)] ?? null;
	const link = schema.collections[helper.getLinkTableName(collection)] ?? null;
	const tables = [shadow?.collection, link?.collection].filter((table) => table !== undefined);

	const referenceFields = uniq([
		...Object.keys(shadow?.fields ?? {}).filter((field) => field.startsWith(VERSION_REFERENCE_PREFIX)),
		...Object.keys(link?.fields ?? {}).filter((field) => field !== primary),
	]);

	const a2oReferences = schema.relations.flatMap((relation): VersionedA2OReference[] => {
		const allowed = relation.meta?.one_allowed_collections;

		if (relation.collection !== collection || relation.related_collection || !allowed) return [];

		const reference = helper.getVersionReferenceField(relation.field);

		if (!referenceFields.includes(reference)) return [];

		return allowed
			.filter((related) => schema.collections[helper.getShadowTableName(related)])
			.map((related) => ({
				column: helper.getA2OVersionReferenceField(relation.field, related),
				reference,
				collectionField: relation.meta!.one_collection_field!,
				collection: related,
			}));
	});

	const versionField = (field: string): FieldOverview => {
		const base = shadow?.fields[field] ?? link?.fields[field] ?? shadow?.fields[VERSION_SYSTEM_FIELDS.id];

		return base
			? { ...base, field }
			: { ...live.fields[primary]!, field, type: 'string', special: [], defaultValue: null, nullable: true };
	};

	const isNumericKey = ['integer', 'bigInteger'].includes(live.fields[primary]?.type ?? '');

	const fields: Record<string, FieldOverview> = {
		...live.fields,
		...Object.fromEntries(
			[...Object.values(VERSION_SYSTEM_FIELDS), ...referenceFields].map((field) => [field, versionField(field)]),
		),
		[VERSIONED_KEY_FIELD]: {
			...live.fields[primary]!,
			field: VERSIONED_KEY_FIELD,
			type: isNumericKey ? live.fields[primary]!.type : 'string',
			special: [],
			defaultValue: null,
		},
	};

	for (const { column, reference } of a2oReferences) {
		fields[column] = { ...fields[reference]!, field: column };
	}

	// Relations of the live collection apply to the read collection as well, the references to versions of related
	// items come from the shadow table
	const relations = schema.relations.flatMap((relation): Relation[] => [
		...(relation.collection === collection ||
		(relation.collection === shadow?.collection && relation.field.startsWith(VERSION_REFERENCE_PREFIX))
			? [{ ...relation, collection: name }]
			: []),
		...(relation.related_collection === collection ? [{ ...relation, related_collection: name }] : []),
	]);

	for (const { column, collection: related } of a2oReferences) {
		relations.push({
			collection: name,
			field: column,
			related_collection: helper.getShadowTableName(related),
			schema: null,
			meta: null,
		});
	}

	return {
		collection: { ...live, collection: name, primary: VERSIONED_KEY_FIELD, fields },
		relations,
		shadow,
		link,
		// Relations between version tables belong to the table they're defined on
		tableRelations: tableRelations.filter((relation) =>
			isVersioningTable(relation.collection)
				? tables.includes(relation.collection)
				: tables.includes(relation.related_collection ?? ''),
		),
		referenceFields,
		a2oReferences,
	};
}
