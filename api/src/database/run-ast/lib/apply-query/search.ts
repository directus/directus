import { NUMERIC_TYPES, RELATIONAL_TYPES } from '@directus/constants';
import { useEnv } from '@directus/env';
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
	const env = useEnv()
	const maxRelationDepth = parseInt(env['SEARCH_RELATION_MAX_DEPTH']?.toString() ?? '3');

	dbQuery.andWhere(function (queryBuilder) {
		addWhereConditions(knex, schema, queryBuilder, searchQuery, collection, aliasMap, permissions, maxRelationDepth);
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
	maxRelationDepth: number,
	currentDepth = 1,
) {
	const { number: numberHelper } = getHelpers(knex);
	const searchLower = searchQuery.toLowerCase();
	const { fields, cases, caseMap, allowedFields } = getSearchableFields(schema, collection, permissions);
	const primaryKey = schema.collections[collection]?.primary;
	let needsFallbackCondition = true;

	fields.forEach(([name, field]) => {
		if (isFieldRelational(field) && primaryKey && currentDepth <= maxRelationDepth) {
			 queryBuilder.orWhereExists(function (subQuery) {
				const { relation } = getRelationInfo(schema.relations, collection, name);
				
				if (!relation) return;

				subQuery
				.from(relation.collection)
				.whereRaw(`?? = ??`, [`${relation.collection}.${relation.field}`, `${collection}.${primaryKey}`])
				.andWhere(function (subSubQuery) {
					addWhereConditions(knex, schema, subSubQuery, searchQuery, relation.collection, aliasMap, permissions, maxRelationDepth, currentDepth + 1);
				})
			})

			return;
		}

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
 * Check if a field is a relational field.
 */
function isFieldRelational(field: FieldOverview): boolean {
	return RELATIONAL_TYPES.some(value => field.special.includes(value));
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
