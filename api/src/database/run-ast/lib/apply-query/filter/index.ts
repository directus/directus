import { InvalidQueryError } from '@directus/errors';
import type { Filter, Permission, Relation, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { getCases } from '../../../../../permissions/modules/process-ast/lib/get-cases.js';
import type { AliasMap } from '../../../../../utils/get-column-path.js';
import { getColumnPath } from '../../../../../utils/get-column-path.js';
import { getRelationInfo } from '../../../../../utils/get-relation-info.js';
import { getHelpers } from '../../../../helpers/index.js';
import { addJoin } from '../add-join.js';
import { getFilterPath } from '../get-filter-path.js';
import { getOperation } from '../get-operation.js';
import applyQuery from '../index.js';
import { extractFieldFromFilter } from './extract-field-from-filter.js';
import { getFilterType } from './get-filter-type.js';
import { applyOperator } from './operator.js';
import { validateOperator } from './validate-operator.js';

export function applyFilter(
	knex: Knex,
	schema: SchemaOverview,
	rootQuery: Knex.QueryBuilder,
	rootFilter: Filter,
	collection: string,
	aliasMap: AliasMap,
	cases: Filter[],
	permissions: Permission[],
) {
	const relations: Relation[] = schema.relations;
	let hasJoins = false;
	let hasMultiRelationalFilter = false;

	addJoins(rootQuery, rootFilter, collection);
	addWhereClauses(knex, rootQuery, rootFilter, collection);

	return { query: rootQuery, hasJoins, hasMultiRelationalFilter };

	function addJoins(dbQuery: Knex.QueryBuilder, filter: Filter, collection: string) {
		// eslint-disable-next-line prefer-const
		for (let [key, value] of Object.entries(filter)) {
			if (key === '_or' || key === '_and') {
				// If the _or array contains an empty object (full permissions), we should short-circuit and ignore all other
				// permission checks, as {} already matches full permissions.
				if (key === '_or' && value.some((subFilter: Record<string, any>) => Object.keys(subFilter).length === 0)) {
					// But only do so, if the value is not equal to `cases` (since then this is not permission related at all)
					// or the length of value is 1, ie. only the empty filter.
					// If the length is more than one it means that some items (and fields) might now be available, so
					// the joins are required for the case/when construction.
					if (value !== cases || value.length === 1) {
						continue;
					} else {
						// Otherwise we can at least filter out all empty filters that would not add joins anyway
						value = value.filter((subFilter: Record<string, any>) => Object.keys(subFilter).length > 0);
					}
				}

				value.forEach((subFilter: Record<string, any>) => {
					addJoins(dbQuery, subFilter, collection);
				});

				continue;
			}

			const filterPath = getFilterPath(key, value);

			if (
				filterPath.length > 1 ||
				(!(key.includes('(') && key.includes(')')) && schema.collections[collection]?.fields[key]?.type === 'alias')
			) {
				// If this is an o2m relational filter, skip adding joins here so it can be handled via WHERE EXISTS
				// in addWhereClauses. This avoids row multiplication from joins.
				const pathRoot = filterPath[0]!.split(':')[0]!;
				const { relationType } = getRelationInfo(relations, collection, pathRoot);

				if (relationType === 'o2m') {
					continue;
				}

				const { hasMultiRelational, isJoinAdded } = addJoin({
					path: filterPath,
					collection,
					knex,
					schema,
					rootQuery,
					aliasMap,
				});

				if (!hasJoins) {
					hasJoins = isJoinAdded;
				}

				if (!hasMultiRelationalFilter) {
					hasMultiRelationalFilter = hasMultiRelational;
				}
			}
		}
	}

	function addWhereClauses(
		knex: Knex,
		dbQuery: Knex.QueryBuilder,
		filter: Filter,
		collection: string,
		logical: 'and' | 'or' = 'and',
		skipO2mRoots?: Set<string>,
	) {
		// Build a field-specific permission filter from top-level cases for the given root field
		const buildFieldCases = (fieldRoot: string) => {
			if (!cases || !Array.isArray(cases) || cases.length === 0) return null;
			const combinedCases = { _or: cases };
			return extractFieldFromFilter(combinedCases, fieldRoot) || null;
		};

		// Utility to compute grouped o2m for a specific filter object at this logical depth
		const computeGroups = (flt: Filter) => {
			const groups: Record<string, { pathForWhere: string[]; operation: { operator: string; value: any } }[]> = {};
			const keys = new Set<string>();

			for (const [k, v] of Object.entries(flt)) {
				if (k === '_or' || k === '_and') continue;
				const initial = getFilterPath(k, v);
				let pth = initial;
				if (pth.length === 1 && k.includes('.')) pth = k.split('.');
				if (pth.length <= 1) continue;
				const root = pth[0]!.split(':')[0]!;
				const { relation: rel, relationType: rt } = getRelationInfo(relations, collection, root);
				if (!rel || rt !== 'o2m') continue;
				const op = getOperation(k, v);
				if (!op) continue;
				const childKey = Object.keys(v)?.[0];
				if (childKey === '_none' || childKey === '_some') continue;
				(groups[root] ||= []).push({ pathForWhere: pth, operation: op });
				keys.add(k);
			}

			return { groups, keys };
		};

		const { groups: groupedO2m, keys: groupedKeys } = computeGroups(filter);

		// Emit a single EXISTS per grouped o2m root at this scope (unless explicitly skipped)
		for (const [root, items] of Object.entries(groupedO2m)) {
			if (skipO2mRoots && skipO2mRoots.has(root)) continue;
			let subFilterCombined;

			if (logical === 'or') {
				subFilterCombined = {
					_or: items.map(({ pathForWhere, operation }) =>
						buildNestedFilterFromPath(pathForWhere.slice(1), { [operation.operator]: operation.value }),
					),
				};
			} else {
				const merged = {};

				for (const { pathForWhere, operation } of items) {
					const cond = buildNestedFilterFromPath(pathForWhere.slice(1), { [operation.operator]: operation.value });
					mergeInto(merged, cond);
				}

				subFilterCombined = merged;
			}

			const { relation } = getRelationInfo(relations, collection, root);

			dbQuery[logical].whereExists((subQueryKnex) => {
				const field = relation!.field;
				const childCollection = relation!.collection;
				const childFkColumn = `${childCollection}.${field}`;
				const parentPkColumn = `${collection}.${schema.collections[relation!.related_collection!]!.primary}`;

				subQueryKnex.select(1).from(childCollection).where(knex.ref(childFkColumn), '=', knex.ref(parentPkColumn));

				const fieldCases = buildFieldCases(root);
				const finalFilter = fieldCases ? { _and: [subFilterCombined, fieldCases] } : subFilterCombined;
				applyQuery(knex, relation!.collection, subQueryKnex, { filter: finalFilter }, schema, [], permissions);
			});
		}

		// Second pass: apply non-grouped conditions normally
		for (const [key, value] of Object.entries(filter)) {
			if (key === '_or' || key === '_and') {
				// If the _or array contains an empty object (full permissions), we should short-circuit and ignore all other
				// permission checks, as {} already matches full permissions.
				if (key === '_or' && value.some((subFilter: Record<string, any>) => Object.keys(subFilter).length === 0)) {
					continue;
				}

				/** @NOTE this callback function isn't called until Knex runs the query */
				dbQuery[logical].where((subQuery) => {
					// Aggregate grouping across all sub-filters within this logical array
					const aggregated: Record<string, { pathForWhere: string[]; operation: { operator: string; value: any } }[]> =
						{};
						
					const aggregatedRoots = new Set<string>();

					value.forEach((subFilter: Record<string, any>) => {
						const { groups: subGroups } = computeGroups(subFilter);

						for (const [root, items] of Object.entries(subGroups)) {
							(aggregated[root] ||= []).push(...items);
							aggregatedRoots.add(root);
						}
					});

					// Emit EXISTS clauses for this logical group
					// Special-case _or: different o2m roots must be combined with OR between their EXISTS
					if (key === '_or') {
						subQuery.where((orGroup) => {
							const entries = Object.entries(aggregated);

							entries.forEach(([root, items], index) => {
								const { relation } = getRelationInfo(relations, collection, root);

								// Within a single root, keep OR across its items
								const subFilterCombined = {
									_or: items.map(({ pathForWhere, operation }) =>
										buildNestedFilterFromPath(pathForWhere.slice(1), { [operation.operator]: operation.value }),
									),
								};

								const existsBuilder = (subQueryKnex: Knex.QueryBuilder<any, unknown[]>) => {
									const field = relation!.field;
									const childCollection = relation!.collection;
									const childFkColumn = `${childCollection}.${field}`;
									const parentPkColumn = `${collection}.${schema.collections[relation!.related_collection!]!.primary}`;

									subQueryKnex
										.select(1)
										.from(childCollection)
										.where(knex.ref(childFkColumn), '=', knex.ref(parentPkColumn));

									applyQuery(
										knex,
										relation!.collection,
										subQueryKnex,
										{ filter: subFilterCombined },
										schema,
										[],
										permissions,
									);
								};

								if (index === 0) {
									orGroup.whereExists(existsBuilder);
								} else {
									// Use OR between roots
									orGroup.orWhereExists(existsBuilder);
								}
							});
						});
					} else {
						for (const [root, items] of Object.entries(aggregated)) {
							const { relation } = getRelationInfo(relations, collection, root);
							const fieldCases = buildFieldCases(root);
							// Merge all item conditions for this root with AND semantics
							const merged = {};

							for (const { pathForWhere, operation } of items) {
								const cond = buildNestedFilterFromPath(pathForWhere.slice(1), {
									[operation.operator]: operation.value,
								});

								mergeInto(merged, cond);
							}

							const finalFilter = fieldCases ? { _and: [merged, fieldCases] } : merged;

							subQuery.whereExists((subQueryKnex) => {
								const field = relation!.field;
								const childCollection = relation!.collection;
								const childFkColumn = `${childCollection}.${field}`;
								const parentPkColumn = `${collection}.${schema.collections[relation!.related_collection!]!.primary}`;

								subQueryKnex
									.select(1)
									.from(childCollection)
									.where(knex.ref(childFkColumn), '=', knex.ref(parentPkColumn));

								applyQuery(knex, relation!.collection, subQueryKnex, { filter: finalFilter }, schema, [], permissions);
							});
						}
					}

					// Recurse into each sub-filter while skipping these aggregated roots to avoid duplicate EXISTS
					value.forEach((subFilter: Record<string, any>) => {
						addWhereClauses(knex, subQuery, subFilter, collection, key === '_and' ? 'and' : 'or', aggregatedRoots);
					});
				});

				continue;
			}

			if (groupedKeys.has(key)) continue;
			const filterPath = getFilterPath(key, value);
			/**
			 * For A2M fields, the path can contain an optional collection scope <field>:<scope>
			 */
			let pathForWhere = filterPath;

			if (pathForWhere.length === 1 && key.includes('.')) {
				// Support dot-paths passed in directly (eg: "event.organizer"), which
				// get-filter-path won't expand when operator object is used.
				pathForWhere = key.split('.');
			}

			const pathRoot = pathForWhere[0]!.split(':')[0]!;
			if (skipO2mRoots && skipO2mRoots.has(pathRoot)) continue;
			const { relation, relationType } = getRelationInfo(relations, collection, pathRoot);
			const operation = getOperation(key, value);

			if (!operation) continue;

			const { operator: filterOperator, value: filterValue } = operation;

			if (
				pathForWhere.length > 1 ||
				(!(key.includes('(') && key.includes(')')) && schema.collections[collection]?.fields[key]?.type === 'alias')
			) {
				if (!relation) continue;

				if (relationType === 'o2m' || relationType === 'o2a') {
					let pkField: Knex.Raw<any> | string = `${collection}.${
						schema.collections[relation!.related_collection!]!.primary
					}`;

					if (relationType === 'o2a') {
						pkField = knex.raw(getHelpers(knex).schema.castA2oPrimaryKey(), [pkField]);
					}

					const childKey = Object.keys(value)?.[0];

					if (childKey === '_none' || childKey === '_some') {
						const subQueryBuilder =
							(filter: Filter, cases: Filter[]) => (subQueryKnex: Knex.QueryBuilder<any, unknown[]>) => {
								const field = relation!.field;
								const collection = relation!.collection;
								const column = `${collection}.${field}`;

								subQueryKnex
									.select({ [field]: column })
									.from(collection)
									.whereNotNull(column);

								applyQuery(knex, relation!.collection, subQueryKnex, { filter }, schema, cases, permissions);
							};

						const { cases: subCases } = getCases(relation!.collection, permissions, []);

						if (childKey === '_none') {
							dbQuery[logical].whereNotIn(
								pkField as string,
								subQueryBuilder(Object.values(value)[0] as Filter, subCases),
							);

							continue;
						} else if (childKey === '_some') {
							dbQuery[logical].whereIn(pkField as string, subQueryBuilder(Object.values(value)[0] as Filter, subCases));
							continue;
						}
					}

					// For o2m relationships, use WHERE EXISTS instead of joins
					if (relationType === 'o2m') {
						// For o2m relationships, we don't need the alias map since we're using WHERE EXISTS
						// We can directly reference the table and field names
						const subFilter = buildChildFilter(relation.collection, pathForWhere.slice(1), filterOperator, filterValue);
						const fieldCases = buildFieldCases(pathRoot);

						dbQuery[logical].whereExists((subQueryKnex) => {
							const field = relation.field;
							const childCollection = relation.collection;
							const childFkColumn = `${childCollection}.${field}`;
							const parentPkColumn = `${collection}.${schema.collections[relation!.related_collection!]!.primary}`;

							subQueryKnex
								.select(1)
								.from(childCollection)
								.where(knex.raw(`${childFkColumn} = ${parentPkColumn}`));

							const finalFilter = fieldCases ? { _and: [subFilter, fieldCases] } : subFilter;
							applyQuery(knex, relation.collection, subQueryKnex, { filter: finalFilter }, schema, [], permissions);
						});

						continue;
					}
				}

				if (filterPath.includes('_none') || filterPath.includes('_some')) {
					throw new InvalidQueryError({
						reason: `"${
							filterPath.includes('_none') ? '_none' : '_some'
						}" can only be used with top level relational alias field`,
					});
				}

				const { columnPath, targetCollection, addNestedPkField } = getColumnPath({
					path: filterPath,
					collection,
					relations,
					aliasMap,
					schema,
				});

				if (addNestedPkField) {
					filterPath.push(addNestedPkField);
				}

				if (!columnPath) continue;

				const { type, special } = getFilterType(
					schema.collections[targetCollection]!.fields,
					filterPath.at(-1)!,
					targetCollection,
				)!;

				validateOperator(type, filterOperator, special);

				applyOperator(knex, dbQuery, schema, columnPath, filterOperator, filterValue, logical, targetCollection);
			} else {
				const { type, special } = getFilterType(schema.collections[collection]!.fields, filterPath[0]!, collection)!;

				validateOperator(type, filterOperator, special);

				const aliasedCollection = aliasMap['']?.alias || collection;

				applyOperator(
					knex,
					dbQuery,
					schema,
					`${aliasedCollection}.${filterPath[0]}`,
					filterOperator,
					filterValue,
					logical,
					collection,
				);
			}
		}
	}

	function buildNestedFilterFromPath(pathParts: string[], terminal: Record<string, any>) {
		return pathParts.reduceRight((acc, part) => ({ [part]: acc }), terminal);
	}

	function buildChildFilter(childCollection: string, remainingParts: string[], operator: string, value: any) {
		if (!remainingParts || remainingParts.length === 0) {
			const pk = schema.collections[childCollection]?.primary;

			if (pk) {
				return { [pk]: { [operator]: value } };
			}
		}

		return buildNestedFilterFromPath(remainingParts, { [operator]: value });
	}

	function mergeInto(target: Record<string, any>, source: Record<string, any>) {
		for (const [k, v] of Object.entries(source)) {
			if (
				k in target &&
				typeof target[k] === 'object' &&
				target[k] !== null &&
				typeof v === 'object' &&
				v !== null &&
				!Array.isArray(target[k]) &&
				!Array.isArray(v)
			) {
				mergeInto(target[k], v);
			} else {
				target[k] = v;
			}
		}
	}
}
