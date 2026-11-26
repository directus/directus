import { InvalidQueryError } from '@directus/errors';
import type { Aggregate, SchemaOverview } from '@directus/types';
import { getRelationInfo } from '@directus/utils';
import { VERSION_FIELD, VERSION_SYSTEM_FIELDS } from '../services/version-tables/constants.js';

/** Version system fields of live items without a version, which act as the published version */
export const PUBLISHED_SYSTEM_FIELDS: Record<string, unknown> = {
	...Object.fromEntries(Object.keys(VERSION_SYSTEM_FIELDS).map((key) => [key, null])),
	type: 'published',
};

/**
 * Whether the field refers to the version system fields, either `directus_version` itself or one of its keys
 */
export function isSystemField(field: string) {
	return field === VERSION_FIELD || field.startsWith(`${VERSION_FIELD}.`);
}

/**
 * Column of a `directus_version.<key>` field in the shadow table, other fields are returned as is
 */
export function toSystemColumn(field: string) {
	return isSystemField(field) ? getSystemColumn(field.slice(VERSION_FIELD.length + 1)) : field;
}

/**
 * Column of a version system field in the shadow table, throws for keys that don't exist
 */
export function getSystemColumn(key: string) {
	if (!Object.hasOwn(VERSION_SYSTEM_FIELDS, key)) {
		throw new InvalidQueryError({ reason: `"${VERSION_FIELD}.${key}" doesn't exist` });
	}

	return VERSION_SYSTEM_FIELDS[key as keyof typeof VERSION_SYSTEM_FIELDS];
}

/**
 * Map a sort on version system fields to its column, keeping the direction
 */
export function rewriteSort(sort: string) {
	const descending = sort.startsWith('-');

	return `${descending ? '-' : ''}${toSystemColumn(descending ? sort.slice(1) : sort)}`;
}

/**
 * Apply `map` to the fields of every aggregate function
 */
export function mapAggregate(aggregate: Aggregate, map: (fields: string[]) => string[]): Aggregate {
	return Object.fromEntries(Object.entries(aggregate).map(([func, fields]) => [func, map(fields ?? [])]));
}

/**
 * Collection at the end of a path of relational fields, or `null` if a segment isn't a relation to a single collection.
 * a2o fields have to be scoped to one of their related collections, `item:articles`.
 */
export function getRelatedCollection(schema: SchemaOverview, collection: string, path: string[]) {
	let current: string | null = collection;

	for (const segment of path) {
		const [field, scope] = segment.split(':');
		const { relation, relationType, oppositeCollection } = getRelationInfo(schema.relations, current!, field);

		if (relationType === 'a2o') {
			current = scope && relation?.meta?.one_allowed_collections?.includes(scope) ? scope : null;
		} else {
			current = scope ? null : oppositeCollection;
		}

		if (!current) return null;
	}

	return current;
}
