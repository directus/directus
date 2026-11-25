import { LOGICAL_FILTER_OPERATORS, RELATIONAL_FILTER_OPERATORS } from '@directus/constants';
import { InvalidQueryError } from '@directus/errors';
import type { Filter, Permission, Relation, SchemaOverview } from '@directus/types';
import { getRelationInfo, isIn, isObject } from '@directus/utils';
import type { Knex } from 'knex';
import { getCases } from '../../../../../permissions/modules/process-ast/lib/get-cases.js';
import type { AliasMap } from '../../../../../utils/get-column-path.js';
import { getColumnPath } from '../../../../../utils/get-column-path.js';
import { getHelpers } from '../../../../helpers/index.js';
import { addJoin } from '../add-join.js';
import { getFilterPath } from '../get-filter-path.js';
import { getOperation } from '../get-operation.js';
import applyQuery from '../index.js';
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
			if (isIn(key, LOGICAL_FILTER_OPERATORS)) {
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

			if (isRelationalFilter(filterPath)) {
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
	) {
		for (const [key, value] of Object.entries(filter)) {
			if (isIn(key, LOGICAL_FILTER_OPERATORS)) {
				// If the _or array contains an empty object (full permissions), we should short-circuit and ignore all other
				// permission checks, as {} already matches full permissions.
				if (key === '_or' && value.some((subFilter: Record<string, any>) => Object.keys(subFilter).length === 0)) {
					continue;
				}

				/** @NOTE this callback function isn't called until Knex runs the query */
				dbQuery[logical].where((subQuery) => {
					value.forEach((subFilter: Record<string, any>) => {
						addWhereClauses(knex, subQuery, subFilter, collection, key === '_and' ? 'and' : 'or');
					});
				});

				continue;
			}

			const filterPath = getFilterPath(key, value);

			/**
			 * For A2M fields, the path can contain an optional collection scope <field>:<scope>
			 */
			const pathRoot = filterPath[0]!.split(':')[0]!;

			const { relation, relationType } = getRelationInfo(relations, collection, pathRoot);

			const relationalOperator = filterPath.find((segment) => isIn(segment, RELATIONAL_FILTER_OPERATORS));

			// _some/_none apply a sub-filter, not a field operation; using getOperation (as we do for regular operators) would skip it
			if (relationalOperator) {
				const isTopLevel = filterPath[1] === relationalOperator;
				const isToMany = relationType === 'o2m' || relationType === 'o2a';

				if (!relation || !isTopLevel || !isToMany) {
					throw new InvalidQueryError({
						reason: `"${relationalOperator}" can only be used with top level relational alias field`,
					});
				}

				const subFilter = value[relationalOperator] as Filter;

				// An empty sub-filter is a no-op
				if (isObject(subFilter) && Object.keys(subFilter).length === 0) continue;

				let pkField: Knex.Raw | string = `${collection}.${schema.collections[relation.related_collection!]!.primary}`;

				if (relationType === 'o2a') {
					pkField = knex.raw(getHelpers(knex).schema.castA2oPrimaryKey(), [pkField]);
				}

				const foreignKeyColumn = `${relation.collection}.${relation.field}`;
				const { cases: subCases } = getCases(relation.collection, permissions, []);

				const relatedKeysQuery = (subQueryKnex: Knex.QueryBuilder) => {
					subQueryKnex
						.select({ [relation.field]: foreignKeyColumn })
						.from(relation.collection)
						.whereNotNull(foreignKeyColumn);

					applyQuery(knex, relation.collection, subQueryKnex, { filter: subFilter }, schema, subCases, permissions);
				};

				if (relationalOperator === '_none') {
					dbQuery[logical].whereNotIn(pkField as string, relatedKeysQuery);
				} else {
					dbQuery[logical].whereIn(pkField as string, relatedKeysQuery);
				}

				continue;
			}

			const operation = getOperation(key, value);

			if (!operation) continue;

			const { operator: filterOperator, value: filterValue } = operation;

			if (isRelationalFilter(filterPath) === false) {
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

				continue;
			}

			if (!relation) continue;

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
		}
	}

	/**
	 * A filter is considered relational if it follows a path into another collection, or targets an alias field
	 */
	function isRelationalFilter(filterPath: string[]) {
		return filterPath.length > 1 || schema.collections[collection]?.fields[filterPath[0]!]?.type === 'alias';
	}
}
