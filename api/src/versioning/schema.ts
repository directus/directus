import type {
	CollectionOverview,
	CollectionsOverview,
	FieldOverview,
	Relation,
	SchemaOverview,
	VersioningOverview,
} from '@directus/types';
import type { Knex } from 'knex';
import { groupBy, partition, uniq } from 'lodash-es';
import { getHelpers } from '../database/helpers/index.js';
import type { VersioningHelper } from '../database/helpers/versioning/types.js';
import {
	VERSION_REFERENCE_PREFIX,
	VERSION_SYSTEM_FIELDS,
	VERSIONED_KEY_FIELD,
} from '../services/version-tables/constants.js';
import { getVersionSpec, type SourceCollections } from '../services/version-tables/plan-version-tables.js';
import { isVersioningTable } from '../services/version-tables/utils.js';

/**
 * How a collection is read together with its versions: through a collection of its own name and primary key, as the
 * live primary key isn't unique across the live items and versions
 */
export type VersionedRead = {
	/** Name of the collection that reads the live items together with their versions */
	name: string;
	/** The schema with the shadow and link tables, and the read collection with its relations */
	schema: SchemaOverview;
	shadow: string | null;
	link: string | null;
	/** Version system fields and references to versions of related items, which the live collection doesn't have */
	versionFields: string[];
	/** Columns that split the version references of a2o fields per related collection */
	a2oReferences: A2OReference[];
};

/**
 * Column of a versioned read collection with the version references of an a2o field for one related collection, and a
 * relation to its shadow table
 */
export type A2OReference = {
	column: string;
	/** Column with the version references of the a2o field */
	reference: string;
	collectionField: string;
	collection: string;
	shadow: string;
};

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

/**
 * Derive the shadow and link tables from the live collections, using the same layout the version table sync creates
 * them with. Mirrored fields take the type of their live field, but none of its defaults or specials, as the values
 * written to versions are already processed against the live collection.
 *
 * @param exists - Whether a table exists in the database, to leave out tables a pending sync hasn't created yet
 */
export function deriveVersionTables(
	schema: SchemaOverview,
	helper: VersioningHelper,
	exists: (table: string) => boolean = () => true,
): VersioningOverview {
	const live = Object.values(schema.collections).filter((collection) => !isVersioningTable(collection.collection));
	const relationsByCollection = groupBy(schema.relations, 'collection');
	const sources: SourceCollections = {};
	const tableSources = new Map<string, CollectionOverview>();

	for (const collection of live) {
		sources[collection.collection] = {
			collection: collection.collection,
			columns: Object.values(collection.fields)
				.filter((field) => !field.alias)
				.map((field) => ({
					name: field.field,
					data_type: field.dbType ?? field.type,
					is_primary_key: field.field === collection.primary,
				})),
			relations: relationsByCollection[collection.collection] ?? [],
		};

		tableSources.set(helper.getShadowTableName(collection.collection), collection);
		tableSources.set(helper.getLinkTableName(collection.collection), collection);
	}

	const versioned = new Set(
		live.filter((collection) => collection.versioned).map((collection) => collection.collection),
	);

	const spec = getVersionSpec(sources, { versioned, helper });
	const result: VersioningOverview = { collections: {}, relations: [] };

	for (const table of Object.values(spec)) {
		if (!exists(table.table)) continue;

		const source = tableSources.get(table.table)!;
		const fields: Record<string, FieldOverview> = {};

		for (const column of table.columns) {
			if (column.kind === 'system') fields[column.name] = SYSTEM_FIELD_OVERVIEWS[column.name]!;
			else if (column.kind === 'reference') fields[column.name] = { ...REFERENCE_FIELD_OVERVIEW, field: column.name };
			else fields[column.name] = mirrorField(source.fields[column.name]!, Boolean(column.primary));
		}

		result.collections[table.table] = {
			collection: table.table,
			primary: table.type === 'shadow' ? VERSION_SYSTEM_FIELDS.id : source.primary,
			singleton: false,
			versioned: false,
			sortField: null,
			note: null,
			accountability: 'all',
			status: 'active',
			fields,
		};

		for (const foreignKey of table.foreignKeys) {
			result.relations.push({
				collection: table.table,
				field: foreignKey.column,
				related_collection: foreignKey.foreign_key_table,
				schema: { ...foreignKey, table: table.table, constraint_name: null },
				meta: null,
			});
		}
	}

	return result;
}

// Mirrored columns drop all constraints of the live column, see `buildMirrorColumn`
function mirrorField(field: FieldOverview, primary: boolean): FieldOverview {
	return {
		...field,
		defaultValue: null,
		nullable: !primary,
		generated: false,
		special: [],
		note: null,
		validation: null,
	};
}

const BASE_FIELD_OVERVIEW: Omit<FieldOverview, 'field' | 'type'> = {
	defaultValue: null,
	nullable: true,
	generated: false,
	dbType: null,
	precision: null,
	scale: null,
	special: [],
	note: null,
	validation: null,
	alias: false,
	searchable: true,
};

const REFERENCE_FIELD_OVERVIEW: FieldOverview = { ...BASE_FIELD_OVERVIEW, field: '', type: 'integer' };

// Matches the columns created by `VersionTablesService.addSystemColumn`
const SYSTEM_FIELD_OVERVIEWS: Record<string, FieldOverview> = Object.fromEntries(
	(
		[
			[VERSION_SYSTEM_FIELDS.id, { type: 'integer', nullable: false, defaultValue: 'AUTO_INCREMENT' }],
			[VERSION_SYSTEM_FIELDS.name, { type: 'string' }],
			[VERSION_SYSTEM_FIELDS.type, { type: 'string', nullable: false, defaultValue: 'draft' }],
			[VERSION_SYSTEM_FIELDS.date_created, { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }],
			[VERSION_SYSTEM_FIELDS.date_updated, { type: 'timestamp' }],
			[VERSION_SYSTEM_FIELDS.user_created, { type: 'uuid' }],
			[VERSION_SYSTEM_FIELDS.user_updated, { type: 'uuid' }],
		] as [string, Partial<FieldOverview>][]
	).map(([field, overrides]) => [field, { ...BASE_FIELD_OVERVIEW, type: 'string', ...overrides, field }]),
);

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

const reads = new WeakMap<SchemaOverview, Map<string, VersionedRead>>();

/**
 * How the collection is read together with its versions, derived once per schema
 */
export function getVersionedRead(knex: Knex, schema: SchemaOverview, collection: string): VersionedRead {
	const tables = getVersionTablesSchema(schema);
	let cache = reads.get(tables);

	if (!cache) {
		cache = new Map();
		reads.set(tables, cache);
	}

	let read = cache.get(collection);

	if (!read) {
		read = createVersionedRead(knex, tables, collection);
		cache.set(collection, read);
		mergedSchemas.add(read.schema);
	}

	return read;
}

/**
 * @param schema - The schema with the shadow and link tables as collections
 */
function createVersionedRead(knex: Knex, schema: SchemaOverview, collection: string): VersionedRead {
	const { versioning: helper } = getHelpers(knex);
	const name = helper.getVersionedReadName(collection);
	const live = schema.collections[collection]!;
	const { primary } = live;
	const shadowTable = helper.getShadowTableName(collection);
	const shadow = schema.versioning?.collections[shadowTable];
	const linkTable = helper.getLinkTableName(collection);
	const link = schema.versioning?.collections[linkTable];

	const systemFields: string[] = Object.values(VERSION_SYSTEM_FIELDS);
	const linkedFields = link ? Object.keys(link.fields).filter((field) => field !== primary) : [];

	const referenceFields = uniq([
		...Object.keys(shadow?.fields ?? {}).filter((field) => field.startsWith(VERSION_REFERENCE_PREFIX)),
		...linkedFields,
	]);

	const isNumericKey = ['integer', 'bigInteger'].includes(live.fields[primary]?.type ?? '');

	const versionField = (field: string): FieldOverview => {
		const base = shadow?.fields[field] ?? link?.fields[field] ?? shadow?.fields[VERSION_SYSTEM_FIELDS.id];

		return base
			? { ...base, field }
			: { ...live.fields[primary]!, field, type: 'string', special: [], defaultValue: null, nullable: true };
	};

	const fields: Record<string, FieldOverview> = {
		...live.fields,
		...Object.fromEntries([...systemFields, ...referenceFields].map((field) => [field, versionField(field)])),
		[VERSIONED_KEY_FIELD]: {
			...live.fields[primary]!,
			field: VERSIONED_KEY_FIELD,
			type: isNumericKey ? live.fields[primary]!.type : 'string',
			special: [],
			defaultValue: null,
		},
	};

	const a2oReferences = schema.relations.flatMap((relation): A2OReference[] => {
		const allowed = relation.meta?.one_allowed_collections;

		if (relation.collection !== collection || relation.related_collection || !allowed) return [];

		const reference = helper.getVersionReferenceField(relation.field);

		if (!referenceFields.includes(reference)) return [];

		return allowed.flatMap((related) => {
			const relatedShadow = helper.getShadowTableName(related);

			if (!schema.collections[relatedShadow]) return [];

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

	for (const { column, reference } of a2oReferences) {
		fields[column] = { ...fields[reference]!, field: column };
	}

	// Relations of the live collection apply to the read collection as well, the references to versions of related
	// items come from the shadow table
	const relations = schema.relations.flatMap((relation): Relation[] => [
		...(relation.collection === collection ||
		(relation.collection === shadowTable && relation.field.startsWith(VERSION_REFERENCE_PREFIX))
			? [{ ...relation, collection: name }]
			: []),
		...(relation.related_collection === collection ? [{ ...relation, related_collection: name }] : []),
	]);

	for (const { column, shadow } of a2oReferences) {
		relations.push({ collection: name, field: column, related_collection: shadow, schema: null, meta: null });
	}

	return {
		name,
		schema: {
			collections: {
				...schema.collections,
				[name]: { ...live, collection: name, primary: VERSIONED_KEY_FIELD, fields },
			},
			relations: [...schema.relations, ...relations],
			...(schema.versioning ? { versioning: schema.versioning } : {}),
		},
		shadow: shadow ? shadowTable : null,
		link: link ? linkTable : null,
		versionFields: [...systemFields, ...referenceFields],
		a2oReferences,
	};
}
