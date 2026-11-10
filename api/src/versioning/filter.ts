import { InvalidQueryError } from '@directus/errors';
import type { Filter, SchemaOverview } from '@directus/types';
import { getRelationInfo, toArray } from '@directus/utils';
import { isPlainObject, mapKeys } from 'lodash-es';
import { getVersionReferenceField, VERSION_META_FIELD } from '../services/version-tables/constants.js';
import { getMetaColumn, PUBLISHED_META } from './fields.js';

/**
 * Remove version meta from a filter, which leaves the parts that can be validated against the live collection.
 * Objects and logical operators left empty are removed as well.
 */
export function stripMetaFilter(filter: Filter | null | undefined): Filter | null {
	if (!filter) return null;

	const strip = (value: unknown): unknown => {
		if (Array.isArray(value)) {
			return value.map(strip).filter((nested) => !isPlainObject(nested) || Object.keys(nested as object).length > 0);
		}

		if (!isPlainObject(value)) return value;

		const result: Record<string, unknown> = {};

		for (const [key, nested] of Object.entries(value as object)) {
			if (key === VERSION_META_FIELD) continue;

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
	/** Collection the filter applies to, which is the virtual collection, a shadow table or a live collection */
	collection: string;
	/** Whether the rows have version meta columns, otherwise they're live items and match the meta of published items */
	hasMeta: boolean;
	/** Whether m2o relations can reference versions of related items */
	references: boolean;
	/** Shadow tables the filter reads from */
	shadows: Set<string>;
};

/**
 * Map version meta in the filter to the meta columns. An m2o relation to a versioned collection matches either
 * the linked live item or the referenced version, so nested filters (including version meta) apply to both.
 */
export function rewriteFilter(filter: Filter, level: FilterLevel): Filter {
	const result: Record<string, unknown> = {};
	const conditions: Filter[] = [];

	const rewriteAt = (value: unknown, collection: string, versioned: boolean) =>
		rewriteFilter(value as Filter, { ...level, collection, hasMeta: versioned, references: versioned });

	for (const [key, value] of Object.entries(filter)) {
		if ((key === '_and' || key === '_or') && Array.isArray(value)) {
			result[key] = value.map((nested) => rewriteFilter(nested, level));
			continue;
		}

		if (key === '_some' || key === '_none') {
			result[key] = rewriteFilter(value as Filter, level);
			continue;
		}

		if (key === VERSION_META_FIELD) {
			if (level.hasMeta) {
				Object.assign(
					result,
					mapKeys(value ?? {}, (_, metaKey) => getMetaColumn(metaKey)),
				);
			} else if (!matchesPublishedMeta(value as Record<string, Record<string, unknown>>)) {
				// Never matches, as an empty `_in` compiles to `1 = 0`. A `_null` check on the primary key would still match
				// rows without a related item, as relations are left joined
				conditions.push({ [level.schema.collections[level.collection]!.primary]: { _in: [] } } as Filter);
			}

			continue;
		}

		const related = isPlainObject(value) && !key.startsWith('_') && !isFieldCondition(value as Record<string, unknown>);

		const { relationType, oppositeCollection } = related
			? getRelationInfo(level.schema.relations, level.collection, key)
			: { relationType: null, oppositeCollection: null };

		if (!oppositeCollection || (relationType !== 'm2o' && relationType !== 'o2m')) {
			result[key] = value;
			continue;
		}

		if (relationType === 'o2m') {
			result[key] = rewriteAt(value, oppositeCollection, false);
			continue;
		}

		const live = nestOrExists(key, rewriteAt(value, oppositeCollection, false));
		const referenceField = getVersionReferenceField(key);

		const shadow = level.references
			? getRelationInfo(level.schema.relations, level.collection, referenceField).oppositeCollection
			: null;

		if (shadow) {
			level.shadows.add(shadow);

			const version = nestOrExists(referenceField, rewriteAt(value, shadow, true));
			conditions.push({ _or: [live, { _and: [{ [key]: { _null: true } }, version] }] } as Filter);
		} else if ('_and' in live || '_or' in live) {
			conditions.push(live);
		} else {
			Object.assign(result, live);
		}
	}

	if (conditions.length === 0) return result as Filter;
	if (Object.keys(result).length > 0) conditions.unshift(result as Filter);

	return { _and: conditions } as Filter;
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
 * Whether a filter on version meta matches the meta of published live items, which is evaluated in memory as live
 * items of collections that aren't versioned have no meta columns. Throws on unknown keys.
 */
export function matchesPublishedMeta(filter: Record<string, Record<string, unknown>>) {
	return Object.entries(filter ?? {}).every(([key, condition]) => {
		getMetaColumn(key);

		return Object.entries(condition ?? {}).every(([operator, argument]) =>
			matchesOperator(PUBLISHED_META[key], operator, argument),
		);
	});
}

/**
 * Evaluate a single filter operator against a value of the published meta. String operators ignore case. Other
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
				reason: `Operator "${operator}" isn't supported on "${VERSION_META_FIELD}" of live items`,
			});
	}
}
