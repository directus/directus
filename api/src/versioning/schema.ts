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
		...linkedFields.map((field) => helper.getVersionReferenceField(field)),
	]);

	const isNumericKey = ['integer', 'bigInteger'].includes(live.fields[primary]?.type ?? '');

	const versionField = (field: string): FieldOverview => {
		const linked = field.startsWith(VERSION_REFERENCE_PREFIX)
			? link?.fields[field.slice(VERSION_REFERENCE_PREFIX.length)]
			: undefined;

		const base = shadow?.fields[field] ?? linked ?? shadow?.fields[VERSION_SYSTEM_FIELDS.id];

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

	// Relations of the live collection apply to the read collection as well, the references to versions of related
	// items come from the shadow table
	const relations = schema.relations.flatMap((relation): Relation[] => [
		...(relation.collection === collection ||
		(relation.collection === shadowTable && relation.field.startsWith(VERSION_REFERENCE_PREFIX))
			? [{ ...relation, collection: name }]
			: []),
		...(relation.related_collection === collection ? [{ ...relation, related_collection: name }] : []),
	]);

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
	};
}
