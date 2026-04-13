import { NUMERIC_TYPES } from '@directus/constants';
import type { FieldOverview, NumericType, Permission, Relation, SchemaOverview } from '@directus/types';
import { isIn } from '@directus/utils';
import type { Knex } from 'knex';
import { getCases } from '../../../../permissions/modules/process-ast/lib/get-cases.js';
import type { AliasMap } from '../../../../utils/get-column-path.js';
import { isValidUuid } from '../../../../utils/is-valid-uuid.js';
import { parseNumericString } from '../../../../utils/parse-numeric-string.js';
import { getHelpers } from '../../../helpers/index.js';
import { applyFilter } from './filter/index.js';

interface TranslationSearchInfo {
	junctionCollection: string;
	parentFkField: string;
	parentPkField: string;
	fields: [string, FieldOverview][];
}

/**
 * Detect translation relations on a collection and return the junction collection info
 * needed to build an EXISTS subquery for searching translated content.
 */
function getTranslationSearchInfo(
	schema: SchemaOverview,
	relations: Relation[],
	collection: string,
): TranslationSearchInfo[] {
	const collectionSchema = schema.collections[collection];
	if (!collectionSchema) return [];

	// Find all alias fields with the 'translations' special marker
	const translationFields = Object.entries(collectionSchema.fields).filter(([_name, field]) =>
		field.special.includes('translations'),
	);

	if (translationFields.length === 0) return [];

	const results: TranslationSearchInfo[] = [];

	for (const [fieldName] of translationFields) {
		// Find the o2m relation from the parent to the junction table
		const relation = relations.find((r) => r.related_collection === collection && r.meta?.one_field === fieldName);

		if (!relation) continue;

		const junctionCollection = relation.collection;
		const junctionSchema = schema.collections[junctionCollection];

		if (!junctionSchema) continue;

		const parentFkField = relation.field;
		const languageFkField = relation.meta?.junction_field;
		const parentPkField = collectionSchema.primary;

		// Identify system fields to exclude from search (PKs and FKs)
		const systemFields = new Set(
			[junctionSchema.primary, parentFkField, languageFkField].filter((f): f is string => f != null),
		);

		// Get searchable string/text fields from the junction collection
		const fields = Object.entries(junctionSchema.fields).filter(
			([name, field]) =>
				!systemFields.has(name) &&
				field.searchable !== false &&
				!field.special.includes('conceal') &&
				['text', 'string'].includes(field.type),
		);

		if (fields.length === 0) continue;

		results.push({ junctionCollection, parentFkField, parentPkField, fields });
	}

	return results;
}

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

		// Search through translation junction tables via EXISTS subquery
		const translationInfos = getTranslationSearchInfo(schema, schema.relations, collection);

		for (const translationInfo of translationInfos) {
			const junctionAllowedFields = new Set(
				permissions.filter((p) => p.collection === translationInfo.junctionCollection).flatMap((p) => p.fields ?? []),
			);

			// Skip if non-admin user has no permissions for the junction collection
			if (permissions.length > 0 && junctionAllowedFields.size === 0) {
				continue;
			}

			const { cases: junctionCases } = getCases(translationInfo.junctionCollection, permissions, []);

			let junctionFields = translationInfo.fields;

			// Apply permission restrictions on junction collection fields
			if (junctionCases.length !== 0 && !junctionAllowedFields.has('*')) {
				junctionFields = junctionFields.filter(([name]) => junctionAllowedFields.has(name));
			}

			// Skip if all junction fields are filtered out by permissions
			if (junctionFields.length === 0) {
				continue;
			}

			if (junctionFields.length > 0) {
				needsFallbackCondition = false;

				queryBuilder.orWhereExists(function (subQuery) {
					subQuery
						.select(knex.raw('1'))
						.from(translationInfo.junctionCollection)
						.where(
							`${translationInfo.junctionCollection}.${translationInfo.parentFkField}`,
							knex.ref(`${collection}.${translationInfo.parentPkField}`),
						)
						.andWhere(function (innerWhere) {
							for (const [fieldName] of junctionFields) {
								innerWhere.orWhereRaw(`LOWER(??) LIKE ?`, [
									`${translationInfo.junctionCollection}.${fieldName}`,
									`%${searchQuery.toLowerCase()}%`,
								]);
							}
						});

					// Apply junction collection permission filters inside the subquery
					if (junctionCases.length > 0) {
						applyFilter(
							knex,
							schema,
							subQuery,
							{ _or: junctionCases },
							translationInfo.junctionCollection,
							aliasMap,
							junctionCases,
							permissions,
						);
					}
				});
			}
		}

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
