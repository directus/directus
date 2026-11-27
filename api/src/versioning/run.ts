import type { CollectionVersioning, Filter, Item, Query, SchemaOverview } from '@directus/types';
import { mergeFilters, toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { isNil, isPlainObject, mapKeys, pick, uniq } from 'lodash-es';
import { getHelpers } from '../database/helpers/index.js';
import type { Level } from '../database/run-ast/run-ast.js';
import { VERSION_FIELD, VERSION_SYSTEM_FIELDS } from '../services/version-tables/constants.js';
import type { A2MNode, FieldNode, M2ONode, O2MNode, VersionedNode } from '../types/ast.js';
import { getVersionedSource } from './source.js';

const SYSTEM_COLUMNS: string[] = Object.values(VERSION_SYSTEM_FIELDS);

/** Version system field keys by their column in the shadow table */
const SYSTEM_FIELD_KEYS = new Map<string, string>(
	Object.entries(VERSION_SYSTEM_FIELDS).map(([key, column]) => [column, key]),
);

/**
 * Switch a versioned level to reading the combined rows of its collection: the read collection with its source, the
 * query with the version query merged in, the relations of the nested nodes pointing at the read collection, and the
 * live primary key and system columns selected.
 */
export function applyVersionedRead(level: Level, schema: SchemaOverview, knex: Knex) {
	const read = schema.versioning![level.collection]!;
	const collection = read.collection.collection;
	const { primary } = schema.collections[level.collection]!;

	// Paging, search, alias etc. come from the live query, the parts that can read version fields from the versioned
	// one. Only the versioned parts that are set replace the live ones, so a live default sort is kept.
	const query: Query = {
		...level.query,
		...pick(level.versioning!.query, ['filter', 'sort', 'group', 'aggregate']),
	};

	const isAggregate = Boolean(query.group || Object.keys(query.aggregate ?? {}).length > 0);

	const children = level.children.map((child) => {
		if (child.type === 'm2o' || child.type === 'a2o') {
			return { ...child, relation: { ...child.relation, collection } };
		}

		if (child.type === 'o2m') return { ...child, relation: { ...child.relation, related_collection: collection } };

		return child;
	});

	// The live primary key and system columns link the rows to the nested nodes and their parent
	const selected = new Set<string>();

	if (isAggregate) {
		for (const field of query.group ?? []) {
			if (SYSTEM_COLUMNS.includes(field)) selected.add(field);
		}
	} else {
		for (const field of [primary, ...SYSTEM_COLUMNS, ...read.referenceFields]) selected.add(field);
	}

	for (const child of children) {
		if (child.type === 'field') selected.delete(child.fieldKey);
	}

	level.source = getVersionedSource(knex, schema, level.collection);
	level.collection = collection;
	level.query = query;

	level.children = [
		...children,
		...[...selected].map(
			(field): FieldNode => ({ type: 'field', name: field, fieldKey: field, whenCase: [], alias: false }),
		),
	];
}

/**
 * Move the system columns of the rows of a versioned level under `directus_version`, and rename aggregated ones to
 * their `directus_version.<key>` name. m2o relations that reference a version instead of a live item, and aren't read
 * as nested node, are set to `{ directus_version: { id } }`.
 */
export function formatVersionedLevel(
	items: Item | Item[],
	level: Level,
	read: CollectionVersioning,
	knex: Knex,
): Item | Item[] {
	const { versioning } = getHelpers(knex);
	const aggregates = Object.keys(level.query.aggregate ?? {});
	const isArray = Array.isArray(items);
	items = toArray(items);

	const references = level.children.flatMap((child) => {
		if (child.type !== 'field') return [];

		const reference = versioning.getVersionReferenceField(child.name);

		return read.referenceFields.includes(reference) ? [{ fieldKey: child.fieldKey, reference }] : [];
	});

	const renameSystemColumn = (column: string) => {
		const key = SYSTEM_FIELD_KEYS.get(column);
		return key ? `${VERSION_FIELD}.${key}` : column;
	};

	items = items.map((row: Item) => {
		const result: Item = {};
		const system: Item = {};

		for (const [field, value] of Object.entries(row)) {
			const key = SYSTEM_FIELD_KEYS.get(field);

			if (key) {
				system[key] = value ?? null;
			} else if (aggregates.includes(field) && isPlainObject(value)) {
				result[field] = mapKeys(value, (_, column) => renameSystemColumn(column));
			} else {
				result[field] = value;
			}
		}

		for (const { fieldKey, reference } of references) {
			if (isNil(result[fieldKey]) && !isNil(result[reference])) {
				result[fieldKey] = { [VERSION_FIELD]: { id: result[reference] } };
			}
		}

		if (Object.keys(system).length > 0) {
			result[VERSION_FIELD] = isPlainObject(result[VERSION_FIELD]) ? { ...result[VERSION_FIELD], ...system } : system;
		}

		return result;
	});

	return isArray ? items : items.at(0);
}

/**
 * Whether the row is a live item, rows of collections that aren't read with versions always are
 */
export function isLiveRow(row: Item) {
	const type = row[VERSION_SYSTEM_FIELDS.type] ?? row[VERSION_FIELD]?.type;

	return type === undefined || type === 'published';
}

/**
 * Limit a versioned m2o or o2m node to the rows related to the parent rows. Live parents link to live items through the
 * relation, other versions through their version references.
 */
export function applyVersionedParentFilter(
	node: (M2ONode | O2MNode) & { versioning: VersionedNode },
	parents: Item[],
	schema: SchemaOverview,
) {
	const { reference } = node.versioning;
	const { field } = node.relation;

	let keyColumn: string;
	let idColumn: string;
	let keys: unknown[];
	let ids: unknown[] = [];

	if (node.type === 'm2o') {
		// The parent holds the key of the related live item, or the id of the referenced version
		keyColumn = schema.collections[node.relation.related_collection!]!.primary;
		idColumn = VERSION_SYSTEM_FIELDS.id;
		keys = getValues(parents, field);

		if (reference) {
			ids = getValues(
				parents.filter((parent) => isNil(parent[field])),
				reference,
			);
		}
	} else {
		// The related rows hold the key of the live parent, or the id of the parent version
		keyColumn = field;
		idColumn = reference ?? VERSION_SYSTEM_FIELDS.id;
		keys = getValues(parents.filter(isLiveRow), node.parentKey);

		if (reference) {
			ids = getValues(
				parents.filter((parent) => !isLiveRow(parent)),
				VERSION_SYSTEM_FIELDS.id,
			);
		}
	}

	node.versioning.query.filter = mergeFilters(
		node.versioning.query.filter ?? null,
		getRelatedRowsFilter(keyColumn, keys, idColumn, ids),
	);
}

/**
 * Limit each versioned related collection of an a2o node to the rows the parent rows of that collection relate to: the
 * live item of their key, or the version they reference if they don't link to a live item
 */
export function applyVersionedA2OParentFilter(node: A2MNode, parents: Item[], schema: SchemaOverview) {
	const { field } = node.relation;
	const collectionField = node.relation.meta!.one_collection_field!;

	for (const collection of node.names) {
		const versioning = node.versioning?.[collection];

		if (!versioning) continue;

		const related = parents.filter((parent) => parent[collectionField] === collection);
		const keys = getValues(related, field);

		const ids = versioning.reference
			? getValues(
					related.filter((parent) => isNil(parent[field])),
					versioning.reference,
				)
			: [];

		const keyColumn = schema.collections[collection]!.primary;

		versioning.query.filter = mergeFilters(
			versioning.query.filter ?? null,
			getRelatedRowsFilter(keyColumn, keys, VERSION_SYSTEM_FIELDS.id, ids),
		);

		node.query[collection] = { ...node.query[collection], limit: -1 };
	}
}

function getValues(rows: Item[], column: string) {
	return uniq(rows.map((row) => row[column])).filter((value) => !isNil(value));
}

/** Live items with one of the keys, or versions with one of the ids */
function getRelatedRowsFilter(keyColumn: string, keys: unknown[], idColumn: string, ids: unknown[]): Filter {
	const conditions: Filter[] = [];

	if (keys.length > 0) {
		conditions.push({
			_and: [{ [keyColumn]: { _in: keys } }, { [VERSION_SYSTEM_FIELDS.type]: { _eq: 'published' } }],
		} as Filter);
	}

	if (ids.length > 0) conditions.push({ [idColumn]: { _in: ids } } as Filter);

	if (conditions.length === 0) return { [keyColumn]: { _in: [] } } as Filter;

	return conditions.length === 1 ? conditions[0]! : ({ _or: conditions } as Filter);
}

/**
 * Set the m2o field of the parents to the related live item, or the referenced version if the parent doesn't link to
 * a live item. A reference to a published version resolves to its live item.
 */
export function mergeVersionedM2O(
	node: M2ONode & { versioning: VersionedNode },
	nestedItems: Item[],
	parents: Item[],
	schema: SchemaOverview,
) {
	const { reference } = node.versioning;
	const primary = schema.collections[node.relation.related_collection!]!.primary;
	const live = new Map<string, Item>();
	const versions = new Map<string, Item>();

	for (const item of nestedItems) {
		const system = item[VERSION_FIELD];

		if (system?.type === 'published' && !isNil(item[primary])) live.set(String(item[primary]), item);
		if (!isNil(system?.id)) versions.set(String(system.id), item);
	}

	for (const parent of parents) {
		const key = parent[node.relation.field];
		const id = reference ? parent[reference] : null;

		if (!isNil(key)) {
			parent[node.fieldKey] = live.get(String(key)) ?? null;
		} else {
			parent[node.fieldKey] = !isNil(id) ? (versions.get(String(id)) ?? null) : null;
		}
	}
}

/**
 * Add the o2m related rows to their parents: live rows to the live parent they relate to, and rows referencing a
 * version to that version
 */
export function mergeVersionedO2M(node: O2MNode & { versioning: VersionedNode }, nestedItems: Item[], parents: Item[]) {
	const { reference } = node.versioning;
	const { field } = node.relation;
	const live = new Map<string, Item>();
	const versions = new Map<string, Item>();

	for (const parent of parents) {
		parent[node.fieldKey] ??= [];

		if (isLiveRow(parent)) {
			if (!isNil(parent[node.parentKey])) live.set(String(parent[node.parentKey]), parent);
		} else if (!isNil(parent[VERSION_SYSTEM_FIELDS.id])) {
			versions.set(String(parent[VERSION_SYSTEM_FIELDS.id]), parent);
		}
	}

	for (const item of nestedItems) {
		const key = item[field]?.[node.parentKey] ?? item[field];

		if (isLiveRow(item) && !isNil(key)) live.get(String(key))?.[node.fieldKey].push(item);
		if (reference && !isNil(item[reference])) versions.get(String(item[reference]))?.[node.fieldKey].push(item);
	}
}

/**
 * Value of a column of a row of a versioned level, which has its system columns under `directus_version`
 */
export function getVersionedValue(row: Item, column: string) {
	const key = Object.entries(VERSION_SYSTEM_FIELDS).find(([, systemColumn]) => systemColumn === column)?.[0];

	return key && !(column in row) ? row[VERSION_FIELD]?.[key] : row[column];
}

/**
 * The related item of an a2o relation of a parent in the items of a versioned related collection: the live item of the
 * key, or the referenced version if the parent doesn't link to a live item
 */
export function findVersionedA2OItem(
	node: A2MNode,
	collection: string,
	items: Item[],
	parent: Item,
	schema: SchemaOverview,
): Item | null {
	const reference = node.versioning?.[collection]?.reference;
	const primary = schema.collections[collection]!.primary;
	const key = parent[node.relation.field];

	if (!isNil(key)) {
		return items.find((item) => isLiveRow(item) && String(item[primary]) === String(key)) ?? null;
	}

	const id = reference ? parent[reference] : null;

	if (isNil(id)) return null;

	return items.find((item) => String(item[VERSION_FIELD]?.id) === String(id)) ?? null;
}
