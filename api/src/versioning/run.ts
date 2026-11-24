import type { Filter, Item, SchemaOverview } from '@directus/types';
import { toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { isNil, uniq } from 'lodash-es';
import { getHelpers } from '../database/helpers/index.js';
import { VERSION_FIELD, VERSION_SYSTEM_FIELDS } from '../services/version-tables/constants.js';
import { nestVersionSystemFields } from '../services/version-tables/utils.js';
import type { AST, FieldNode, M2ONode, O2MNode, VersionedNode } from '../types/ast.js';
import { createVirtualCollection } from './virtual-collection.js';

export type VersionedLevelNode = (AST | M2ONode | O2MNode) & { versioning: VersionedNode };

const SYSTEM_COLUMNS: string[] = Object.values(VERSION_SYSTEM_FIELDS);

/**
 * The level of a versioned node as it's read from the combined rows of its collection: the virtual collection with its
 * schema and source, the query with the version system fields mapped to their columns, and the system columns selected.
 */
export function getVersionedLevel(node: VersionedLevelNode, schema: SchemaOverview, knex: Knex) {
	const virtual = createVirtualCollection(knex, schema, node.name);
	const { primary } = schema.collections[node.name]!;
	const query = { ...node.query, ...node.versioning.query };
	const isAggregate = Boolean(query.group || Object.keys(query.aggregate ?? {}).length > 0);

	const children = node.children.map((child) => {
		if (child.type === 'm2o' || child.type === 'a2o') {
			return { ...child, relation: { ...child.relation, collection: virtual.name } };
		}

		if (child.type === 'o2m') return { ...child, relation: { ...child.relation, related_collection: virtual.name } };

		return child;
	});

	const hasPrimary = children.some((child) => child.type === 'field' && child.fieldKey === primary);

	// The live primary key and system columns link the rows to the nested nodes and their parent
	const selected = isAggregate
		? (query.group ?? []).filter((field) => SYSTEM_COLUMNS.includes(field))
		: [...(hasPrimary ? [] : [primary]), ...virtual.versionFields];

	return {
		node,
		name: virtual.name,
		schema: virtual.schema,
		source: virtual.source,
		versionFields: virtual.versionFields,
		query,
		children: [
			...children,
			...selected.map(
				(field): FieldNode => ({ type: 'field', name: field, fieldKey: field, whenCase: [], alias: false }),
			),
		],
	};
}

/**
 * Move the system columns of the rows of a versioned level under `directus_version`. Relations that reference a version
 * instead of a live item, and aren't read as nested node, are set to `{ directus_version: { id } }`.
 */
export function formatVersionedLevel(
	items: Item | Item[],
	node: VersionedLevelNode,
	versionFields: string[],
	knex: Knex,
): Item | Item[] {
	const { versioning } = getHelpers(knex);
	const rows = toArray(items);

	for (const child of node.children) {
		if (child.type !== 'field' && child.type !== 'a2o') continue;

		const field = child.type === 'field' ? child.name : child.relation.field;
		const reference = versioning.getVersionReferenceField(field);

		if (!versionFields.includes(reference)) continue;

		for (const row of rows) {
			if (isNil(row[child.fieldKey]) && !isNil(row[reference])) {
				row[child.fieldKey] = { [VERSION_FIELD]: { id: row[reference] } };
			}
		}
	}

	const formatted = rows.map(nestVersionSystemFields);

	return Array.isArray(items) ? formatted : formatted[0]!;
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

	const values = (rows: Item[], column: string) =>
		uniq(rows.map((row) => row[column])).filter((value) => !isNil(value));

	let keyColumn: string;
	let idColumn: string;
	let keys: unknown[];
	let ids: unknown[] = [];

	if (node.type === 'm2o') {
		// The parent holds the key of the related live item, or the id of the referenced version
		keyColumn = schema.collections[node.relation.related_collection!]!.primary;
		idColumn = VERSION_SYSTEM_FIELDS.id;
		keys = values(parents, field);

		if (reference) {
			ids = values(
				parents.filter((parent) => isNil(parent[field])),
				reference,
			);
		}
	} else {
		// The related rows hold the key of the live parent, or the id of the parent version
		keyColumn = field;
		idColumn = reference ?? VERSION_SYSTEM_FIELDS.id;
		keys = values(parents.filter(isLiveRow), node.parentKey);

		if (reference) {
			ids = values(
				parents.filter((parent) => !isLiveRow(parent)),
				VERSION_SYSTEM_FIELDS.id,
			);
		}
	}

	const conditions: Filter[] = [];

	if (keys.length > 0) {
		conditions.push({
			_and: [{ [keyColumn]: { _in: keys } }, { [VERSION_SYSTEM_FIELDS.type]: { _eq: 'published' } }],
		} as Filter);
	}

	if (ids.length > 0) conditions.push({ [idColumn]: { _in: ids } } as Filter);

	let filter: Filter;

	if (conditions.length === 0) {
		filter = { [keyColumn]: { _in: [] } } as Filter;
	} else {
		filter = conditions.length === 1 ? conditions[0]! : ({ _or: conditions } as Filter);
	}

	const current = node.versioning.query.filter;

	node.versioning.query.filter = current ? ({ _and: [current, filter] } as Filter) : filter;
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
