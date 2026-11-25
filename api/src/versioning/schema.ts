import type { CollectionsOverview, FieldOverview, Relation, SchemaOverview } from '@directus/types';
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
 * collections of the project
 */
export function extractVersioning(schema: SchemaOverview): SchemaOverview {
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

	return { collections, relations, versioning: { collections: tables, relations: tableRelations } };
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

const readSchemas = new WeakMap<SchemaOverview, Map<string, SchemaOverview>>();

/**
 * The schema with the shadow and link tables, and the read collection of the versioned read with its relations.
 * Built once per schema, as it copies all of its collections and relations.
 */
export function getVersionedReadSchema(
	schema: SchemaOverview,
	collection: string,
	read: Pick<VersionedNode, ReadFields>,
): SchemaOverview {
	const tables = getVersionTablesSchema(schema);
	let cache = readSchemas.get(tables);

	if (!cache) {
		cache = new Map();
		readSchemas.set(tables, cache);
	}

	let readSchema = cache.get(collection);

	if (!readSchema) {
		readSchema = createVersionedReadSchema(tables, collection, read);
		cache.set(collection, readSchema);
		mergedSchemas.add(readSchema);
	}

	return readSchema;
}

/**
 * @param schema - The schema with the shadow and link tables as collections
 */
function createVersionedReadSchema(
	schema: SchemaOverview,
	collection: string,
	read: Pick<VersionedNode, ReadFields>,
): SchemaOverview {
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
	const relations = schema.relations.flatMap((relation): Relation[] => [
		...(relation.collection === collection ||
		(relation.collection === read.shadow && relation.field.startsWith(VERSION_REFERENCE_PREFIX))
			? [{ ...relation, collection: read.name }]
			: []),
		...(relation.related_collection === collection ? [{ ...relation, related_collection: read.name }] : []),
	]);

	for (const { column, shadow } of read.a2oReferences) {
		relations.push({ collection: read.name, field: column, related_collection: shadow, schema: null, meta: null });
	}

	return {
		collections: {
			...schema.collections,
			[read.name]: { ...live, collection: read.name, primary: VERSIONED_KEY_FIELD, fields },
		},
		relations: [...schema.relations, ...relations],
		...(schema.versioning ? { versioning: schema.versioning } : {}),
	};
}
