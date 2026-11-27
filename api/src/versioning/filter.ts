import { InvalidQueryError } from '@directus/errors';
import type { Filter, SchemaOverview } from '@directus/types';
import { getRelationInfo, toArray } from '@directus/utils';
import { isPlainObject, mapKeys } from 'lodash-es';
import type { VersioningHelper } from '../database/helpers/versioning/types.js';
import { VERSION_FIELD } from '../services/version-tables/constants.js';
import { getSystemColumn, PUBLISHED_SYSTEM_FIELDS } from './fields.js';

/**
 * Remove version system fields from a filter, which leaves the parts that can be validated against the live collection.
 * Objects and logical operators left empty are removed as well.
 */
export function stripSystemFilter(filter: Filter | null | undefined): Filter | null {
	if (!filter) return null;

	const strip = (value: unknown): unknown => {
		if (Array.isArray(value)) {
			return value.map(strip).filter((nested) => !isPlainObject(nested) || Object.keys(nested as object).length > 0);
		}

		if (!isPlainObject(value)) return value;

		const result: Record<string, unknown> = {};

		for (const [key, nested] of Object.entries(value as object)) {
			if (key === VERSION_FIELD) continue;

			const stripped = strip(nested);

			if (isPlainObject(nested) && Object.keys(stripped as object).length === 0) continue;
			if ((key === '_and' || key === '_or') && (stripped as unknown[]).length === 0) continue;

			result[key] = stripped;
		}

		return result;
	};

	return strip(filter) as Filter;
}

export type FilterLevel = {
	schema: SchemaOverview;
	versioning: VersioningHelper;
	/** Collection the filter applies to, which is a versioned read collection, a shadow table or a live collection */
	collection: string;
	/** Whether the rows have system columns, otherwise they're live items and match the system fields of published items */
	hasSystemFields: boolean;
	/** Whether m2o relations can reference versions of related items */
	references: boolean;
	/** Shadow tables the filter reads from, with the fields it reads from them */
	shadows: Map<string, Set<string>>;
};

/**
 * Map version system fields in the filter to the system columns. An m2o relation to a versioned collection matches either
 * the linked live item or the referenced version, so nested filters (including version system fields) apply to both.
 */
export function rewriteFilter(filter: Filter, level: FilterLevel): Filter {
	const result: Record<string, unknown> = {};
	const conditions: Filter[] = [];

	for (const [key, value] of Object.entries(filter)) {
		if ((key === '_and' || key === '_or') && Array.isArray(value)) {
			result[key] = value.map((nested) => rewriteFilter(nested, level));
		} else if (key === '_some' || key === '_none') {
			result[key] = rewriteFilter(value as Filter, level);
		} else if (key === VERSION_FIELD) {
			if (level.hasSystemFields) {
				Object.assign(
					result,
					mapKeys(value ?? {}, (_, systemKey) => getSystemColumn(systemKey)),
				);
			} else if (!matchesPublishedSystemFields(value as Record<string, Record<string, unknown>>)) {
				// Never matches, as an empty `_in` compiles to `1 = 0`. A `_null` check on the primary key would still match
				// rows without a related item, as relations are left joined
				conditions.push({ [level.schema.collections[level.collection]!.primary]: { _in: [] } } as Filter);
			}
		} else {
			level.shadows.get(level.collection)?.add(key.split(':')[0]!);

			const rewritten = rewriteField(key, value, level);

			if ('_and' in rewritten || '_or' in rewritten) conditions.push(rewritten);
			else Object.assign(result, rewritten);
		}
	}

	if (conditions.length === 0) return result as Filter;
	if (Object.keys(result).length > 0) conditions.unshift(result as Filter);

	return { _and: conditions } as Filter;
}

/**
 * Rewrite the filter on a single field. Filters on m2o and a2o relations match either the linked live item or the
 * referenced version. An a2o filter is scoped to a related collection, `item:articles`, and follows versions through the
 * column with the references for that collection only.
 */
function rewriteField(key: string, value: unknown, level: FilterLevel): Filter {
	const unchanged = { [key]: value } as Filter;

	if (!isPlainObject(value) || key.startsWith('_') || isFieldCondition(value as Record<string, unknown>)) {
		return unchanged;
	}

	const [field, collection] = key.split(':') as [string, string | undefined];

	const { relation, relationType, oppositeCollection } = getRelationInfo(
		level.schema.relations,
		level.collection,
		field,
	);

	const rewriteAt = (target: string, versioned: boolean) =>
		rewriteFilter(value as Filter, {
			...level,
			collection: target,
			hasSystemFields: versioned,
			references: versioned,
		});

	let live: Filter;
	let referenceField: string;

	if (collection) {
		if (relationType !== 'a2o' || !relation?.meta?.one_allowed_collections?.includes(collection)) return unchanged;

		const nested = rewriteAt(collection, false);

		// A filter left without conditions still requires the related item of that collection to exist
		live =
			Object.keys(nested).length > 0
				? nestFilter(key, nested)
				: ({
						_and: [{ [field]: { _nnull: true } }, { [relation.meta.one_collection_field!]: { _eq: collection } }],
					} as Filter);

		referenceField = level.versioning.getA2OVersionReferenceField(field, collection);
	} else if (oppositeCollection && relationType === 'o2m') {
		return { [key]: rewriteAt(oppositeCollection, false) } as Filter;
	} else if (oppositeCollection && relationType === 'm2o') {
		live = nestOrExists(key, rewriteAt(oppositeCollection, false));
		referenceField = level.versioning.getVersionReferenceField(key);
	} else {
		return unchanged;
	}

	const shadow = level.references
		? getRelationInfo(level.schema.relations, level.collection, referenceField).oppositeCollection
		: null;

	if (!shadow) return live;

	if (!level.shadows.has(shadow)) level.shadows.set(shadow, new Set());

	const version = nestOrExists(referenceField, rewriteAt(shadow, true));

	return { _or: [live, { _and: [{ [field]: { _null: true } }, version] }] } as Filter;
}

/** Nest a filter under an m2o field. A filter left without conditions still requires the related item to exist */
export function nestOrExists(field: string, filter: Filter): Filter {
	return Object.keys(filter).length > 0 ? nestFilter(field, filter) : ({ [field]: { _nnull: true } } as Filter);
}

/**
 * Nest a filter on the related item under an m2o field. The filter engine only follows the first key of a nested
 * filter and doesn't support logical operators below a relation, so those are moved above the field instead, which
 * is equivalent for m2o relations: `{ author: { _and: [a, b] } }` becomes `{ _and: [{ author: a }, { author: b }] }`.
 */
export function nestFilter(field: string, filter: Filter): Filter {
	const parts = Object.entries(filter).map(([key, value]): Filter => {
		if ((key === '_and' || key === '_or') && Array.isArray(value)) {
			return { [key]: value.map((nested: Filter) => nestFilter(field, nested)) } as Filter;
		}

		return { [field]: { [key]: value } } as Filter;
	});

	return parts.length === 1 ? parts[0]! : ({ _and: parts } as Filter);
}

/**
 * Operators directly on a field, like `author: { _null: true }`, as opposed to a filter on the related item
 */
export function isFieldCondition(value: Record<string, unknown>) {
	return Object.keys(value).every((key) => key.startsWith('_') && !['_and', '_or', '_some', '_none'].includes(key));
}

/**
 * Whether a filter on version system fields matches the system fields of published live items, which is evaluated in memory as live
 * items of collections that aren't versioned have no system columns. Throws on unknown keys.
 */
export function matchesPublishedSystemFields(filter: Record<string, Record<string, unknown>>) {
	return Object.entries(filter ?? {}).every(([key, condition]) => {
		getSystemColumn(key);

		return Object.entries(condition ?? {}).every(([operator, argument]) =>
			matchesOperator(PUBLISHED_SYSTEM_FIELDS[key], operator, argument),
		);
	});
}

/**
 * Evaluate a single filter operator against a value of the published system fields. String operators ignore case. Other
 * operators throw, unless the value is `null`, which never matches a comparison.
 */
export function matchesOperator(value: unknown, operator: string, argument: unknown) {
	const flag = argument === true || argument === 'true' || argument === 1 || argument === '1';

	switch (operator) {
		case '_eq':
			return value === argument;
		case '_neq':
			return value !== argument;
		case '_in':
			return toArray(argument as unknown).includes(value);
		case '_nin':
			return !toArray(argument as unknown).includes(value);
		case '_null':
		case '_empty':
			return (value === null) === flag;
		case '_nnull':
		case '_nempty':
			return (value !== null) === flag;
		case '_contains':
		case '_icontains':
			return typeof value === 'string' && value.toLowerCase().includes(String(argument).toLowerCase());
		case '_starts_with':
		case '_istarts_with':
			return typeof value === 'string' && value.toLowerCase().startsWith(String(argument).toLowerCase());
		case '_ends_with':
		case '_iends_with':
			return typeof value === 'string' && value.toLowerCase().endsWith(String(argument).toLowerCase());
		default:
			// Comparisons with null never match, like in the database
			if (value === null) return false;

			throw new InvalidQueryError({
				reason: `Operator "${operator}" isn't supported on "${VERSION_FIELD}" of live items`,
			});
	}
}
