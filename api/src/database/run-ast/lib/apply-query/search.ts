import { applyFilter } from './filter/index.js';
import { getCases } from '../../../../permissions/modules/process-ast/lib/get-cases.js';
import type { AliasMap } from '../../../../utils/get-column-path.js';
import { isValidUuid } from '../../../../utils/is-valid-uuid.js';
import { parseNumericString } from '../../../../utils/parse-numeric-string.js';
import { getHelpers } from '../../../helpers/index.js';
import { NUMERIC_TYPES } from '@directus/constants';
import type { FieldOverview, NumericType, Permission, SchemaOverview } from '@directus/types';
import { isIn } from '@directus/utils';
import type { Knex } from 'knex';

export function applySearch(
	knex: Knex,
	schema: SchemaOverview,
	dbQuery: Knex.QueryBuilder,
	searchQuery: string,
	collection: string,
	aliasMap: AliasMap,
	permissions: Permission[],
) {
	const { number: numberHelper } = getHelpers(knex);

	const allowedFields = new Set(permissions.filter((p) => p.collection === collection).flatMap((p) => p.fields ?? []));

	let fields = Object.entries(schema.collections[collection]!.fields);

	// filter out fields that are not searchable
	fields = fields.filter(([_name, field]) => field.searchable !== false && field.special.includes('conceal') !== true);

	const { cases, caseMap } = getCases(collection, permissions, []);

	// Add field restrictions if non-admin and "everything" is not allowed
	if (cases.length !== 0 && !allowedFields.has('*')) {
		fields = fields.filter((field) => allowedFields.has(field[0]));
	}

	dbQuery.andWhere(function (queryBuilder) {
		let needsFallbackCondition = true;

		fields.forEach(([name, field]) => {
			// only account for when cases when full access is not given
			const whenCases = allowedFields.has('*') ? [] : (caseMap[name] ?? []).map((caseIndex) => cases[caseIndex]!);

			const fieldType = getFieldType(field);

			if (fieldType !== null) {
				needsFallbackCondition = false;
			} else {
				return;
			}

			if (cases.length !== 0 && whenCases?.length !== 0) {
				queryBuilder.orWhere((subQuery) => {
					addSearchCondition(subQuery, name, fieldType, 'and');

					applyFilter(knex, schema, subQuery, { _or: whenCases }, collection, aliasMap, cases, permissions);
				});
			} else {
				addSearchCondition(queryBuilder, name, fieldType, 'or');
			}
		});

		if (needsFallbackCondition) {
			queryBuilder.orWhereRaw('1 = 0');
		}
	});

	function addSearchCondition(
		queryBuilder: Knex.QueryBuilder,
		name: string,
		fieldType: 'string' | 'numeric' | 'uuid',
		logical: 'and' | 'or',
	) {
		if (fieldType === null) {
			return;
		}

		if (fieldType === 'string') {
			queryBuilder[logical].whereRaw(`LOWER(??) LIKE ?`, [`${collection}.${name}`, `%${searchQuery.toLowerCase()}%`]);
		} else if (fieldType === 'numeric') {
			numberHelper.addSearchCondition(queryBuilder, collection, name, parseNumericString(searchQuery)!, logical);
		} else if (fieldType === 'uuid') {
			queryBuilder[logical].where({ [`${collection}.${name}`]: searchQuery });
		}
	}

	function getFieldType(field: FieldOverview): null | 'string' | 'numeric' | 'uuid' {
		if (['text', 'string'].includes(field.type)) {
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
}

function isNumericField(field: FieldOverview): field is FieldOverview & { type: NumericType } {
	return isIn(field.type, NUMERIC_TYPES);
}
