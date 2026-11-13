import { InvalidQueryError } from '@directus/errors';
import type { Aggregate, Item, Query, SchemaOverview } from '@directus/types';
import { getRelationInfo, toArray } from '@directus/utils';
import { isPlainObject, mapKeys, pick, uniq } from 'lodash-es';
import { VERSION_META_FIELD, VERSION_META_KEYS } from '../services/version-tables/constants.js';

/** Version meta of live items without a version, which act as the published version */
export const PUBLISHED_META: Record<string, unknown> = {
	...Object.fromEntries(Object.keys(VERSION_META_KEYS).map((key) => [key, null])),
	type: 'published',
};

/**
 * Whether the field refers to the version meta, either `directus_version` itself or one of its keys
 */
export function isMetaField(field: string) {
	return field === VERSION_META_FIELD || field.startsWith(`${VERSION_META_FIELD}.`);
}

/**
 * Column of a `directus_version.<key>` field in the shadow table, other fields are returned as is
 */
export function toMetaColumn(field: string) {
	return isMetaField(field) ? getMetaColumn(field.slice(VERSION_META_FIELD.length + 1)) : field;
}

/**
 * Column of a version meta key in the shadow table, throws for keys that don't exist
 */
export function getMetaColumn(key: string) {
	const column = VERSION_META_KEYS[key];

	if (!column) throw new InvalidQueryError({ reason: `"${VERSION_META_FIELD}.${key}" doesn't exist` });

	return column;
}

/**
 * Map a sort on version meta to its column, keeping the direction
 */
export function rewriteSort(sort: string) {
	const descending = sort.startsWith('-');

	return `${descending ? '-' : ''}${toMetaColumn(descending ? sort.slice(1) : sort)}`;
}

/**
 * Apply `map` to the fields of every aggregate function
 */
export function mapAggregate(aggregate: Aggregate, map: (fields: string[]) => string[]): Aggregate {
	return Object.fromEntries(Object.entries(aggregate).map(([func, fields]) => [func, map(fields ?? [])]));
}

/**
 * Group and aggregate results on version meta use the same format as the query: grouped meta values end up in
 * `directus_version`, aggregated ones under their `directus_version.<key>` name
 */
export function formatAggregate(item: Item, query: Query) {
	for (const [key, column] of Object.entries(VERSION_META_KEYS)) {
		if (!(column in item)) continue;

		item[VERSION_META_FIELD] = { ...item[VERSION_META_FIELD], [key]: item[column] };
		delete item[column];
	}

	for (const aggregate of Object.keys(query.aggregate ?? {})) {
		if (!isPlainObject(item[aggregate])) continue;

		item[aggregate] = mapKeys(item[aggregate], (_value, column) => {
			const key = Object.keys(VERSION_META_KEYS).find((key) => VERSION_META_KEYS[key] === column);
			return key ? `${VERSION_META_FIELD}.${key}` : column;
		});
	}

	return item;
}

/**
 * Fields for the query against the live collection, without version meta. Relations that only had version meta
 * requested select their primary key instead, which is listed in `added` so it can be removed again afterwards.
 */
export function getEngineFields(schema: SchemaOverview, collection: string, fields: string[]) {
	const result: string[] = [];
	const added: string[] = [];

	for (const field of fields) {
		const path = field.split('.');
		const index = path.indexOf(VERSION_META_FIELD);

		if (index === -1) {
			result.push(field);
			continue;
		}

		const related = index > 0 ? getRelatedCollection(schema, collection, path.slice(0, index)) : null;

		if (related) {
			const primaryPath = [...path.slice(0, index), schema.collections[related]!.primary].join('.');

			if (!fields.includes(primaryPath)) added.push(primaryPath);

			result.push(primaryPath);
		}
	}

	return { fields: result.length > 0 ? uniq(result) : [schema.collections[collection]!.primary], added: uniq(added) };
}

/**
 * Collection at the end of a path of relational fields, or `null` if a segment isn't a relation to a single collection
 */
export function getRelatedCollection(schema: SchemaOverview, collection: string, path: string[]) {
	let current: string | null = collection;

	for (const segment of path) {
		current = getRelationInfo(schema.relations, current!, segment).oppositeCollection;

		if (!current) return null;
	}

	return current;
}

/**
 * Items that aren't versions show up with the meta of a published item, if version meta is requested for them.
 * Applies to related items as well, and trims the meta to the requested keys.
 */
export function injectPublishedMeta(item: Item, fields: string[]) {
	if (!isPlainObject(item)) return;

	if (item[VERSION_META_FIELD] === undefined && requestedMetaKeys(fields).length > 0) {
		item[VERSION_META_FIELD] = { ...PUBLISHED_META };
	}

	if (item[VERSION_META_FIELD] !== undefined) trimVersionMeta(item, fields);

	for (const root of uniq(fields.map((field) => field.split('.')[0]!))) {
		if (root === VERSION_META_FIELD || root === '*') continue;

		const subfields = getSubfields(fields, root);

		if (subfields.length === 0) continue;

		for (const value of toArray(item[root] ?? [])) {
			injectPublishedMeta(value, subfields);
		}
	}

	return item;
}

/**
 * Limit the version meta of an item to the requested keys, removing it entirely if none are requested
 */
export function trimVersionMeta(item: Item, fields: string[]) {
	const keys = requestedMetaKeys(fields);

	if (keys.length === 0) {
		delete item[VERSION_META_FIELD];
	} else {
		item[VERSION_META_FIELD] = pick(item[VERSION_META_FIELD], keys);
	}
}

/**
 * Version meta keys requested in the fields. `directus_version` and `directus_version.*` request all of them,
 * unknown keys throw.
 */
export function requestedMetaKeys(fields: string[]) {
	const keys = new Set<string>();

	for (const field of fields) {
		const [root, key] = field.split('.');

		if (root !== VERSION_META_FIELD) continue;

		if (!key || key === '*') return Object.keys(VERSION_META_KEYS);

		getMetaColumn(key);
		keys.add(key);
	}

	return [...keys];
}

/**
 * Top level fields of the collection that are requested, with `*` expanded and version meta left out
 */
export function getRequestedRoots(schema: SchemaOverview, collection: string, fields: string[]) {
	const roots = new Set<string>();

	for (const field of fields) {
		const root = field.split('.')[0]!;

		if (root === '*') {
			Object.keys(schema.collections[collection]!.fields).forEach((field) => roots.add(field));
		} else if (root !== VERSION_META_FIELD) {
			roots.add(root);
		}
	}

	return [...roots];
}

/**
 * Fields requested below a top level field, relative to it. `*.<field>` applies to every top level field.
 */
export function getSubfields(fields: string[], root: string) {
	return fields.flatMap((field) => {
		if (field.startsWith(`${root}.`)) return [field.slice(root.length + 1)];
		if (field.startsWith('*.')) return [field.slice(2)];
		return [];
	});
}

/**
 * Delete a dotted path from an item. Arrays along the path, like o2m results, have the path deleted from every element.
 */
export function deletePath(item: unknown, path: string) {
	if (!isPlainObject(item)) return;

	const [root, ...rest] = path.split('.');
	const value = (item as Item)[root!];

	if (rest.length === 0) {
		delete (item as Item)[root!];
		return;
	}

	for (const nested of toArray(value ?? [])) {
		deletePath(nested, rest.join('.'));
	}
}
