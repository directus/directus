import { InvalidQueryError } from '@directus/errors';
import type { Filter, Permission, Relation, SchemaOverview } from '@directus/types';
import { getRelationInfo } from '@directus/utils';
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
			if (key === '_or' || key === '_and') {
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

			const operation = getOperation(key, value);

			if (!operation) continue;

			const { operator: filterOperator, value: filterValue } = operation;

			if (
				filterPath.length > 1 ||
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
}
