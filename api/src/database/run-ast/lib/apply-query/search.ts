import { NUMERIC_TYPES } from '@directus/constants';
import type { FieldOverview, NumericType, Permission, SchemaOverview } from '@directus/types';
import { isIn } from '@directus/utils';
import { getRelationInfo } from '@directus/utils';
import type { Knex } from 'knex';
import { getCases } from '../../../../permissions/modules/process-ast/lib/get-cases.js';
import type { AliasMap } from '../../../../utils/get-column-path.js';
import { isValidUuid } from '../../../../utils/is-valid-uuid.js';
import { parseNumericString } from '../../../../utils/parse-numeric-string.js';
import { getHelpers } from '../../../helpers/index.js';
import { applyFilter } from './filter/index.js';

export function applySearch(
	knex: Knex,
	schema: SchemaOverview,
	dbQuery: Knex.QueryBuilder,
	searchQuery: string,
	collection: string,
	aliasMap: AliasMap,
	permissions: Permission[],
) {
	dbQuery.andWhere(function (queryBuilder) {
		addWhereConditions(knex, schema, queryBuilder, searchQuery, collection, aliasMap, permissions);

		const searchableRelationPaths = discoverSearchableRelationPaths(schema, collection, permissions);

		for (const relationPath of searchableRelationPaths) {
			addSearchConditionsForRelationPath(knex, schema, queryBuilder, searchQuery, collection, relationPath, permissions, aliasMap);
		}
	});
}

/**
 * Add where conditions for searching across all searchable fields in a collection with permission checks and case handling
 */
function addWhereConditions(
	knex: Knex,
	schema: SchemaOverview,
	queryBuilder: Knex.QueryBuilder,
	searchQuery: string,
	collection: string,
	aliasMap: AliasMap,
	permissions: Permission[],
) {
	const { number: numberHelper } = getHelpers(knex);
	const searchLower = searchQuery.toLowerCase();
	const { fields, cases, caseMap, allowedFields } = getSearchableFields(schema, collection, permissions);

	let needsFallbackCondition = true;

	fields.forEach(([name, field]) => {
		// only account for when cases when full access is not given
		const whenCases = allowedFields.has('*') ? [] : (caseMap[name] ?? []).map((caseIndex) => cases[caseIndex]!);

		const fieldType = getFieldType(field, searchQuery, numberHelper);

		if (fieldType !== null) {
			needsFallbackCondition = false;
		} else {
			return;
		}

		if (cases.length !== 0 && whenCases?.length !== 0) {
			queryBuilder.orWhere((subQuery) => {
				addSearchCondition(subQuery, collection, name, fieldType, searchQuery, searchLower, numberHelper, 'and');
				applyFilter(knex, schema, subQuery, { _or: whenCases }, collection, aliasMap, cases, permissions);
			});
		} else {
			addSearchCondition(queryBuilder, collection, name, fieldType, searchQuery, searchLower, numberHelper, 'or');
		}
	});

	if (needsFallbackCondition) {
		queryBuilder.orWhereRaw('1 = 0');
	}
}

/**
 * Check if a field is searchable
 */
function isFieldSearchable(field: FieldOverview): boolean {
	return field.searchable !== false && !field.special.includes('conceal');
}

/**
 * Check if a field is a string type
 */
function isStringField(field: FieldOverview): boolean {
	return field.type === 'string' || field.type === 'text';
}

/**
 * Check if a field is a numeric type
 */
function isNumericField(field: FieldOverview): field is FieldOverview & { type: NumericType } {
	return isIn(field.type, NUMERIC_TYPES);
}

/**
 * Get searchable fields for a collection with permission filtering and case handling
 */
function getSearchableFields(schema: SchemaOverview, collection: string, permissions: Permission[]) {
	const allowedFields = new Set(
		permissions.filter((p) => p.collection === collection).flatMap((p) => p.fields ?? []),
	);

	let fields = Object.entries(schema.collections[collection]?.fields || {});

	fields = fields.filter(([_name, field]) => isFieldSearchable(field));

	const { cases, caseMap } = getCases(collection, permissions, []);

	// Add field restrictions if non-admin and "everything" is not allowed
	if (cases.length !== 0 && !allowedFields.has('*')) {
		fields = fields.filter((field) => allowedFields.has(field[0]));
	}

	return {
		fields,
		cases,
		caseMap,
		allowedFields,
	}
}

/**
 * Determine the searchable type of a field
 */
function getFieldType( field: FieldOverview, searchQuery: string, numberHelper: ReturnType<typeof getHelpers>['number']): null | 'string' | 'numeric' | 'uuid' {
	if (isStringField(field)) {
		return 'string';
	}

	if (isNumericField(field)) {
		const number = parseNumericString(searchQuery);

		if (number === null) {
			return null;
		}

		if (numberHelper.isNumberValid(number, field)) {
			return 'numeric';
		}
	}

	if (field.type === 'uuid' && isValidUuid(searchQuery)) {
		return 'uuid';
	}

	return null;
}

/**
 * Add search condition to query builder
 */
function addSearchCondition(
	queryBuilder: Knex.QueryBuilder,
	collection: string,
	fieldName: string,
	fieldType: 'string' | 'numeric' | 'uuid',
	searchQuery: string,
	searchLower: string,
	numberHelper: ReturnType<typeof getHelpers>['number'],
	logical: 'and' | 'or',
) {
	if (fieldType === 'string') {
		queryBuilder[logical].whereRaw(`LOWER(??) LIKE ?`, [`${collection}.${fieldName}`, `%${searchLower}%`]);
	} else if (fieldType === 'numeric') {
		numberHelper.addSearchCondition(queryBuilder, collection, fieldName, parseNumericString(searchQuery)!, logical);
	} else if (fieldType === 'uuid') {
		queryBuilder[logical].where({ [`${collection}.${fieldName}`]: searchQuery });
	}
}

/**
 * Discover all searchable relation paths as arrays with permission checks
 * Returns paths like [['translations'], ['related'], ['related', 'subrelated']]
 */
function discoverSearchableRelationPaths(
	schema: SchemaOverview,
	collection: string,
	permissions: Permission[],
	visited = new Set<string>(),
): string[][] {
	const paths: string[][] = [];
	visited.add(collection);

	const fields = Object.entries(schema.collections[collection]?.fields || {});

	for (const [fieldName, _field] of fields) {
		const { relation, relationType } = getRelationInfo(schema.relations, collection, fieldName);

		if (!relation || relationType !== 'o2m') {
			continue;
		}

		const relatedCollection = relation.collection;

		// Check if related collection has searchable string fields (with permission filtering)
		const hasSearchableFields = getSearchableFields(schema, relatedCollection, permissions).fields.length > 0;

		if (hasSearchableFields) {
			// Add the direct relation path
			paths.push([fieldName]);
		}

		// Check for nested relations (avoid cycles)
		if (!visited.has(relatedCollection)) {
			const nestedPaths = discoverSearchableRelationPaths(schema, relatedCollection, permissions, visited);

			for (const nestedPath of nestedPaths) {
				// Prepend current field to nested path
				paths.push([fieldName, ...nestedPath]);
			}
		}
	}

	return paths;
}

/**
 * Add whereExists subquery conditions for a relation path search with permission checks
 */
function addSearchConditionsForRelationPath(
	knex: Knex,
	schema: SchemaOverview,
	queryBuilder: Knex.QueryBuilder,
	searchLower: string,
	collection: string,
	relationPath: string[],
	permissions: Permission[],
	aliasMap: AliasMap,
) {
	queryBuilder.orWhereExists(function (subquery) {
		const { relation: firstRelation, relationType: firstRelationType } = getRelationInfo(
			schema.relations,
			collection,
			relationPath[0]!,
		);

		if (!firstRelation || firstRelationType !== 'o2m') {
			return;
		}

		subquery.from(firstRelation.collection);
		let currentCollection = firstRelation.collection;
		const primaryKey = schema.collections[collection]!.primary;

		// Join back to the parent collection by comparing the field
		subquery.whereRaw(`??.?? = ??.??`, [currentCollection, firstRelation.field, collection, primaryKey]);

		// Handle nested relations
		for (let i = 1; i < relationPath.length; i++) {
			const fieldName = relationPath[i]!;
			const { relation, relationType } = getRelationInfo(schema.relations, currentCollection, fieldName);

			if (relation && relationType === 'o2m') {
				subquery.leftJoin(
					relation.collection,
					`${currentCollection}.${schema.collections[currentCollection]!.primary}`,
					`${relation.collection}.${relation.field}`,
				);

				currentCollection = relation.collection;
			}
		}

		subquery.andWhere(function (conditionQuery) {
			addWhereConditions(knex, schema, conditionQuery, searchLower, currentCollection, aliasMap, permissions);
		});
	});
}
