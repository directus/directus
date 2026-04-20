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

interface O2MSearchInfo {
	/** Collection on the "many" side of the o2m relation (e.g. `articles_translations`, `comments`). */
	relatedCollection: string;
	/** Field on the related collection that stores the FK back to the parent. */
	parentFkField: string;
	/** PK on the parent collection used for the EXISTS correlation. */
	parentPkField: string;
	/** Text/string fields on the related collection eligible for LIKE matching. */
	fields: [string, FieldOverview][];
}

/**
 * Detect o2m-backed alias fields on `collection` and return the information needed to build
 * an EXISTS subquery against the related collection for each one.
 *
 * This handles both vanilla o2m aliases (e.g. `articles.comments`) and translation aliases
 * (`articles.translations`), since a translation relation is just an o2m in the schema —
 * the only difference is the `special: ['translations']` marker on the alias field, which
 * we deliberately ignore here so the same generator applies.
 *
 * Per-relation gating:
 *   - The alias field's `searchable` flag is the master switch for that relation.
 *   - Individual related-collection fields are then filtered by their own `searchable` flag,
 *     the `conceal` special, and field-type eligibility.
 */
function getO2MSearchInfo(schema: SchemaOverview, relations: Relation[], collection: string): O2MSearchInfo[] {
	const collectionSchema = schema.collections[collection];
	if (!collectionSchema) return [];

	const results: O2MSearchInfo[] = [];

	for (const relation of relations) {
		// Only o2m-shaped relations where `collection` is the "one" side
		if (relation.related_collection !== collection) continue;

		// No alias on the parent means the relation is not addressable by field name — skip
		const aliasFieldName = relation.meta?.one_field;
		if (!aliasFieldName) continue;

		const aliasField = collectionSchema.fields[aliasFieldName];
		if (!aliasField) continue;

		// Master switch: admins opt in per-relation via the alias field's `searchable` flag
		if (aliasField.searchable === false) continue;

		const relatedSchema = schema.collections[relation.collection];
		if (!relatedSchema) continue;

		const parentPkField = collectionSchema.primary;
		const parentFkField = relation.field;

		// Identify structural fields to exclude from LIKE matching: PKs and the FK back to parent.
		// We intentionally do NOT exclude the junction_field FK (e.g. `languages_code` on a
		// translations junction) here — that's just another m2o to a related collection, whose
		// target-table values are not part of this EXISTS. Including it in LIKE is harmless for
		// searches that don't match the raw FK value and cheap to skip via the type filter below,
		// but to preserve parity with the original translation helper we also treat the
		// `junction_field` (when present) as a structural exclusion.
		const structuralFields = new Set<string>(
			[relatedSchema.primary, parentFkField, relation.meta?.junction_field].filter((f): f is string => f != null),
		);

		// Eligible fields: text/string columns with `searchable !== false`, not concealed.
		const fields = Object.entries(relatedSchema.fields).filter(
			([name, f]) =>
				!structuralFields.has(name) &&
				f.searchable !== false &&
				!f.special.includes('conceal') &&
				['text', 'string'].includes(f.type),
		);

		if (fields.length === 0) continue;

		results.push({
			relatedCollection: relation.collection,
			parentFkField,
			parentPkField,
			fields,
		});
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

		// Search into o2m-related collections (including translations) via EXISTS subqueries,
		// one per eligible relation. Gated by `searchable` on the alias field (master switch)
		// and on each related-collection field (per-field opt-out).
		const o2mSearchInfos = getO2MSearchInfo(schema, schema.relations, collection);

		for (const info of o2mSearchInfos) {
			const relatedPermissions = permissions.filter((p) => p.collection === info.relatedCollection);

			// Non-admins (permissions array populated) must have at least one permission entry for the
			// related collection; otherwise they have no access and the subquery is omitted entirely.
			// Admins arrive with an empty permissions array and see the subquery unconditionally.
			if (permissions.length > 0 && relatedPermissions.length === 0) {
				continue;
			}

			const relatedAllowedFields = new Set(relatedPermissions.flatMap((p) => p.fields ?? []));

			const { cases: relatedCases } = getCases(info.relatedCollection, permissions, []);

			let relatedFields = info.fields;

			// Apply per-field permission restrictions on the related collection.
			if (relatedPermissions.length > 0 && !relatedAllowedFields.has('*')) {
				relatedFields = relatedFields.filter(([name]) => relatedAllowedFields.has(name));
			}

			// If permission filtering stripped every field, skip this relation.
			if (relatedFields.length === 0) {
				continue;
			}

			if (relatedFields.length > 0) {
				needsFallbackCondition = false;

				queryBuilder.orWhereExists(function (subQuery) {
					subQuery
						.select(knex.raw('1'))
						.from(info.relatedCollection)
						.where(`${info.relatedCollection}.${info.parentFkField}`, knex.ref(`${collection}.${info.parentPkField}`))
						.andWhere(function (innerWhere) {
							for (const [fieldName] of relatedFields) {
								innerWhere.orWhereRaw(`LOWER(??) LIKE ?`, [
									`${info.relatedCollection}.${fieldName}`,
									`%${searchQuery.toLowerCase()}%`,
								]);
							}
						});

					// Apply related-collection permission filters inside the subquery.
					if (relatedCases.length > 0) {
						applyFilter(
							knex,
							schema,
							subQuery,
							{ _or: relatedCases },
							info.relatedCollection,
							aliasMap,
							relatedCases,
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
