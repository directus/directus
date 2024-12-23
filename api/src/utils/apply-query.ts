import { NUMERIC_TYPES } from '@directus/constants';
import { InvalidQueryError } from '@directus/errors';
import type {
	Aggregate,
	ClientFilterOperator,
	FieldFunction,
	FieldOverview,
	Filter,
	NumericType,
	Permission,
	Query,
	Relation,
	SchemaOverview,
	Type,
} from '@directus/types';
import { getFilterOperatorsForType, getFunctionsForType, getOutputTypeForFunction, isIn } from '@directus/utils';
import type { Knex } from 'knex';
import { clone, isPlainObject } from 'lodash-es';
import { customAlphabet } from 'nanoid/non-secure';
import { getHelpers } from '../database/helpers/index.js';
import { applyCaseWhen } from '../database/run-ast/utils/apply-case-when.js';
import { getCases } from '../permissions/modules/process-ast/lib/get-cases.js';
import type { AliasMap } from './get-column-path.js';
import { getColumnPath } from './get-column-path.js';
import { getColumn } from './get-column.js';
import { getRelationInfo } from './get-relation-info.js';
import { isValidUuid } from './is-valid-uuid.js';
import { parseFilterKey } from './parse-filter-key.js';
import { parseNumericString } from './parse-numeric-string.js';

export const generateAlias = customAlphabet('abcdefghijklmnopqrstuvwxyz', 5);

type ApplyQueryOptions = {
	aliasMap?: AliasMap;
	isInnerQuery?: boolean;
	hasMultiRelationalSort?: boolean | undefined;
	groupWhenCases?: number[][] | undefined;
};

/**
 * Apply the Query to a given Knex query builder instance
 */
export default function applyQuery(
	knex: Knex,
	collection: string,
	dbQuery: Knex.QueryBuilder,
	query: Query,
	schema: SchemaOverview,
	cases: Filter[],
	permissions: Permission[],
	options?: ApplyQueryOptions,
) {
	const aliasMap: AliasMap = options?.aliasMap ?? Object.create(null);
	let hasJoins = false;
	let hasMultiRelationalFilter = false;

	applyLimit(knex, dbQuery, query.limit);

	if (query.offset) {
		applyOffset(knex, dbQuery, query.offset);
	}

	if (query.page && query.limit && query.limit !== -1) {
		applyOffset(knex, dbQuery, query.limit * (query.page - 1));
	}

	if (query.sort && !options?.isInnerQuery && !options?.hasMultiRelationalSort) {
		const sortResult = applySort(knex, schema, dbQuery, query, collection, aliasMap);

		if (!hasJoins) {
			hasJoins = sortResult.hasJoins;
		}
	}

	if (query.search) {
		applySearch(knex, schema, dbQuery, query.search, collection);
	}

	// `cases` are the permissions cases that are required for the current data set. We're
	// dynamically adding those into the filters that the user provided to enforce the permission
	// rules. You should be able to read an item if one or more of the cases matches. The actual case
	// is reused in the column selection case/when to dynamically return or nullify the field values
	// you're actually allowed to read

	const filter: Filter | null = joinFilterWithCases(query.filter, cases);

	if (filter) {
		const filterResult = applyFilter(knex, schema, dbQuery, filter, collection, aliasMap, cases, permissions);

		if (!hasJoins) {
			hasJoins = filterResult.hasJoins;
		}

		hasMultiRelationalFilter = filterResult.hasMultiRelationalFilter;
	}

	if (query.group) {
		const rawColumns = query.group.map((column) => getColumn(knex, collection, column, false, schema));
		let columns;

		if (options?.groupWhenCases) {
			columns = rawColumns.map((column, index) =>
				applyCaseWhen(
					{
						columnCases: options.groupWhenCases![index]!.map((caseIndex) => cases[caseIndex]!),
						column,
						aliasMap,
						cases,
						table: collection,
						permissions,
					},
					{
						knex,
						schema,
					},
				),
			);

			if (query.sort && query.sort.length === 1 && query.sort[0] === query.group[0]) {
				// Special case, where the sort query is injected by the group by operation
				dbQuery.clear('order');

				let order = 'asc';

				if (query.sort[0]!.startsWith('-')) {
					order = 'desc';
				}

				// @ts-expect-error (orderBy does not accept Knex.Raw for some reason, even though it is handled correctly)
				// https://github.com/knex/knex/issues/5711
				dbQuery.orderBy([{ column: columns[0]!, order }]);
			}
		} else {
			columns = rawColumns;
		}

		dbQuery.groupBy(columns);
	}

	if (query.aggregate) {
		applyAggregate(schema, dbQuery, query.aggregate, collection, hasJoins);
	}

	return { query: dbQuery, hasJoins, hasMultiRelationalFilter };
}

/**
 * Apply a given filter object to the Knex QueryBuilder instance.
 *
 * Relational nested filters, like the following example:
 *
 * ```json
 * // Fetch pages that have articles written by Rijk
 *
 * {
 *   "articles": {
 *     "author": {
 *       "name": {
 *         "_eq": "Rijk"
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * are handled by joining the nested tables, and using a where statement on the top level on the
 * nested field through the join. This allows us to filter the top level items based on nested data.
 * The where on the root is done with a subquery to prevent duplicates, any nested joins are done
 * with aliases to prevent naming conflicts.
 *
 * The output SQL for the above would look something like:
 *
 * ```sql
 * SELECT *
 * FROM pages
 * WHERE
 *   pages.id in (
 *     SELECT articles.page_id AS page_id
 *     FROM articles
 *     LEFT JOIN authors AS xviqp ON articles.author = xviqp.id
 *     WHERE xviqp.name = 'Rijk'
 *   )
 * ```
 */

type AddJoinProps = {
	path: string[];
	collection: string;
	aliasMap: AliasMap;
	relations: Relation[];
	rootQuery: Knex.QueryBuilder;
	schema: SchemaOverview;
	knex: Knex;
};

function addJoin({ path, collection, aliasMap, rootQuery, schema, relations, knex }: AddJoinProps) {
	let hasMultiRelational = false;
	let isJoinAdded = false;

	path = clone(path);
	followRelation(path);

	return { hasMultiRelational, isJoinAdded };

	function followRelation(pathParts: string[], parentCollection: string = collection, parentFields?: string) {
		/**
		 * For A2M fields, the path can contain an optional collection scope <field>:<scope>
		 */
		const pathRoot = pathParts[0]!.split(':')[0]!;

		const { relation, relationType } = getRelationInfo(relations, parentCollection, pathRoot);

		if (!relation) {
			return;
		}

		const existingAlias = parentFields
			? aliasMap[`${parentFields}.${pathParts[0]}`]?.alias
			: aliasMap[pathParts[0]!]?.alias;

		if (!existingAlias) {
			const alias = generateAlias();
			const aliasKey = parentFields ? `${parentFields}.${pathParts[0]}` : pathParts[0]!;
			const aliasedParentCollection = aliasMap[parentFields ?? '']?.alias || parentCollection;

			aliasMap[aliasKey] = { alias, collection: '' };

			if (relationType === 'm2o') {
				rootQuery.leftJoin(
					{ [alias]: relation.related_collection! },
					`${aliasedParentCollection}.${relation.field}`,
					`${alias}.${schema.collections[relation.related_collection!]!.primary}`,
				);

				aliasMap[aliasKey]!.collection = relation.related_collection!;

				isJoinAdded = true;
			} else if (relationType === 'a2o') {
				const pathScope = pathParts[0]!.split(':')[1];

				if (!pathScope) {
					throw new InvalidQueryError({
						reason: `You have to provide a collection scope when sorting or filtering on a many-to-any item`,
					});
				}

				rootQuery.leftJoin({ [alias]: pathScope }, (joinClause) => {
					joinClause
						.onVal(`${aliasedParentCollection}.${relation.meta!.one_collection_field!}`, '=', pathScope)
						.andOn(
							`${aliasedParentCollection}.${relation.field}`,
							'=',
							knex.raw(
								getHelpers(knex).schema.castA2oPrimaryKey(),
								`${alias}.${schema.collections[pathScope]!.primary}`,
							),
						);
				});

				aliasMap[aliasKey]!.collection = pathScope;

				isJoinAdded = true;
			} else if (relationType === 'o2a') {
				rootQuery.leftJoin({ [alias]: relation.collection }, (joinClause) => {
					joinClause
						.onVal(`${alias}.${relation.meta!.one_collection_field!}`, '=', parentCollection)
						.andOn(
							`${alias}.${relation.field}`,
							'=',
							knex.raw(
								getHelpers(knex).schema.castA2oPrimaryKey(),
								`${aliasedParentCollection}.${schema.collections[parentCollection]!.primary}`,
							),
						);
				});

				aliasMap[aliasKey]!.collection = relation.collection;

				hasMultiRelational = true;
				isJoinAdded = true;
			} else if (relationType === 'o2m') {
				rootQuery.leftJoin(
					{ [alias]: relation.collection },
					`${aliasedParentCollection}.${schema.collections[relation.related_collection!]!.primary}`,
					`${alias}.${relation.field}`,
				);

				aliasMap[aliasKey]!.collection = relation.collection;

				hasMultiRelational = true;
				isJoinAdded = true;
			}
		}

		let parent: string;

		if (relationType === 'm2o') {
			parent = relation.related_collection!;
		} else if (relationType === 'a2o') {
			const pathScope = pathParts[0]!.split(':')[1];

			if (!pathScope) {
				throw new InvalidQueryError({
					reason: `You have to provide a collection scope when sorting or filtering on a many-to-any item`,
				});
			}

			parent = pathScope;
		} else {
			parent = relation.collection;
		}

		if (pathParts.length > 1) {
			followRelation(pathParts.slice(1), parent, `${parentFields ? parentFields + '.' : ''}${pathParts[0]}`);
		}
	}
}

export type ColumnSortRecord = { order: 'asc' | 'desc'; column: string };

export function applySort(
	knex: Knex,
	schema: SchemaOverview,
	rootQuery: Knex.QueryBuilder,
	query: Query,
	collection: string,
	aliasMap: AliasMap,
	returnRecords = false,
) {
	const rootSort = query.sort!;
	const aggregate = query?.aggregate;
	const relations: Relation[] = schema.relations;
	let hasJoins = false;
	let hasMultiRelationalSort = false;

	const sortRecords = rootSort.map((sortField) => {
		const column: string[] = sortField.split('.');
		let order: 'asc' | 'desc' = 'asc';

		if (sortField.startsWith('-')) {
			order = 'desc';
		}

		if (column[0]!.startsWith('-')) {
			column[0] = column[0]!.substring(1);
		}

		// Is the column name one of the aggregate functions used in the query if there is any?
		if (Object.keys(aggregate ?? {}).includes(column[0]!)) {
			// If so, return the column name without the order prefix
			const operation = column[0]!;

			// Get the field for the aggregate function
			const field = column[1]!;

			// If the operation is countAll there is no field.
			if (operation === 'countAll') {
				return {
					order,
					column: 'countAll',
				};
			}

			// If the operation is a root count there is no field.
			if (operation === 'count' && (field === '*' || !field)) {
				return {
					order,
					column: 'count',
				};
			}

			// Return the column name with the operation and field name
			return {
				order,
				column: returnRecords ? column[0] : `${operation}->${field}`,
			};
		}

		if (column.length === 1) {
			const pathRoot = column[0]!.split(':')[0]!;
			const { relation, relationType } = getRelationInfo(relations, collection, pathRoot);

			if (!relation || ['m2o', 'a2o'].includes(relationType ?? '')) {
				return {
					order,
					column: returnRecords ? column[0] : (getColumn(knex, collection, column[0]!, false, schema) as any),
				};
			}
		}

		const { hasMultiRelational, isJoinAdded } = addJoin({
			path: column,
			collection,
			aliasMap,
			rootQuery,
			schema,
			relations,
			knex,
		});

		const { columnPath } = getColumnPath({
			path: column,
			collection,
			aliasMap,
			relations,
			schema,
		});

		const [alias, field] = columnPath.split('.');

		if (!hasJoins) {
			hasJoins = isJoinAdded;
		}

		if (!hasMultiRelationalSort) {
			hasMultiRelationalSort = hasMultiRelational;
		}

		return {
			order,
			column: returnRecords ? columnPath : (getColumn(knex, alias!, field!, false, schema) as any),
		};
	});

	if (returnRecords) return { sortRecords, hasJoins, hasMultiRelationalSort };

	// Clears the order if any, eg: from MSSQL offset
	rootQuery.clear('order');

	rootQuery.orderBy(sortRecords);

	return { hasJoins, hasMultiRelationalSort };
}

export function applyLimit(knex: Knex, rootQuery: Knex.QueryBuilder, limit: any) {
	if (typeof limit === 'number') {
		getHelpers(knex).schema.applyLimit(rootQuery, limit);
	}
}

export function applyOffset(knex: Knex, rootQuery: Knex.QueryBuilder, offset: any) {
	if (typeof offset === 'number') {
		getHelpers(knex).schema.applyOffset(rootQuery, offset);
	}
}

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
	const helpers = getHelpers(knex);
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
					relations,
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

				validateFilterOperator(type, filterOperator, special);

				applyFilterToQuery(columnPath, filterOperator, filterValue, logical, targetCollection);
			} else {
				const { type, special } = getFilterType(schema.collections[collection]!.fields, filterPath[0]!, collection)!;

				validateFilterOperator(type, filterOperator, special);

				const aliasedCollection = aliasMap['']?.alias || collection;

				applyFilterToQuery(`${aliasedCollection}.${filterPath[0]}`, filterOperator, filterValue, logical, collection);
			}
		}

		function getFilterType(fields: Record<string, FieldOverview>, key: string, collection = 'unknown') {
			const { fieldName, functionName } = parseFilterKey(key);

			const field = fields[fieldName];

			if (!field) {
				throw new InvalidQueryError({ reason: `Invalid filter key "${key}" on "${collection}"` });
			}

			const { type } = field;

			if (functionName) {
				const availableFunctions: string[] = getFunctionsForType(type);

				if (!availableFunctions.includes(functionName)) {
					throw new InvalidQueryError({ reason: `Invalid filter key "${key}" on "${collection}"` });
				}

				const functionType = getOutputTypeForFunction(functionName as FieldFunction);

				return { type: functionType };
			}

			return { type, special: field.special };
		}

		function validateFilterOperator(type: Type, filterOperator: string, special?: string[]) {
			if (filterOperator.startsWith('_')) {
				filterOperator = filterOperator.slice(1);
			}

			if (!getFilterOperatorsForType(type).includes(filterOperator as ClientFilterOperator)) {
				throw new InvalidQueryError({
					reason: `"${type}" field type does not contain the "_${filterOperator}" filter operator`,
				});
			}

			if (
				special?.includes('conceal') &&
				!getFilterOperatorsForType('hash').includes(filterOperator as ClientFilterOperator)
			) {
				throw new InvalidQueryError({
					reason: `Field with "conceal" special does not allow the "_${filterOperator}" filter operator`,
				});
			}
		}

		function applyFilterToQuery(
			key: string,
			operator: string,
			compareValue: any,
			logical: 'and' | 'or' = 'and',
			originalCollectionName?: string,
		) {
			const [table, column] = key.split('.');

			// Is processed through Knex.Raw, so should be safe to string-inject into these where queries
			const selectionRaw = getColumn(knex, table!, column!, false, schema, { originalCollectionName }) as any;

			// Knex supports "raw" in the columnName parameter, but isn't typed as such. Too bad..
			// See https://github.com/knex/knex/issues/4518 @TODO remove as any once knex is updated

			// These operators don't rely on a value, and can thus be used without one (eg `?filter[field][_null]`)
			if (
				(operator === '_null' && compareValue !== false) ||
				(operator === '_nnull' && compareValue === false) ||
				(operator === '_eq' && compareValue === null)
			) {
				dbQuery[logical].whereNull(selectionRaw);
				return;
			}

			if (
				(operator === '_nnull' && compareValue !== false) ||
				(operator === '_null' && compareValue === false) ||
				(operator === '_neq' && compareValue === null)
			) {
				dbQuery[logical].whereNotNull(selectionRaw);
				return;
			}

			if ((operator === '_empty' && compareValue !== false) || (operator === '_nempty' && compareValue === false)) {
				dbQuery[logical].andWhere((query) => {
					query.whereNull(key).orWhere(key, '=', '');
				});
			}

			if ((operator === '_nempty' && compareValue !== false) || (operator === '_empty' && compareValue === false)) {
				dbQuery[logical].andWhere((query) => {
					query.whereNotNull(key).andWhere(key, '!=', '');
				});
			}

			// The following fields however, require a value to be run. If no value is passed, we
			// ignore them. This allows easier use in GraphQL, where you wouldn't be able to
			// conditionally build out your filter structure (#4471)
			if (compareValue === undefined) return;

			if (Array.isArray(compareValue)) {
				// Tip: when using a `[Type]` type in GraphQL, but don't provide the variable, it'll be
				// reported as [undefined].
				// We need to remove any undefined values, as they are useless
				compareValue = compareValue.filter((val) => val !== undefined);
			}

			// Cast filter value (compareValue) based on function used
			if (column!.includes('(') && column!.includes(')')) {
				const functionName = column!.split('(')[0] as FieldFunction;
				const type = getOutputTypeForFunction(functionName);

				if (['integer', 'float', 'decimal'].includes(type)) {
					compareValue = Array.isArray(compareValue) ? compareValue.map(Number) : Number(compareValue);
				}
			}

			// Cast filter value (compareValue) based on type of field being filtered against
			const [collection, field] = key.split('.');
			const mappedCollection = (originalCollectionName || collection)!;

			if (mappedCollection! in schema.collections && field! in schema.collections[mappedCollection]!.fields) {
				const type = schema.collections[mappedCollection]!.fields[field!]!.type;

				if (['date', 'dateTime', 'time', 'timestamp'].includes(type)) {
					if (Array.isArray(compareValue)) {
						compareValue = compareValue.map((val) => helpers.date.parse(val));
					} else {
						compareValue = helpers.date.parse(compareValue);
					}
				}

				if (['integer', 'float', 'decimal'].includes(type)) {
					if (Array.isArray(compareValue)) {
						compareValue = compareValue.map((val) => Number(val));
					} else {
						compareValue = Number(compareValue);
					}
				}
			}

			if (operator === '_eq') {
				dbQuery[logical].where(selectionRaw, '=', compareValue);
			}

			if (operator === '_neq') {
				dbQuery[logical].whereNot(selectionRaw, compareValue);
			}

			if (operator === '_ieq') {
				dbQuery[logical].whereRaw(`LOWER(??) = ?`, [selectionRaw, `${compareValue.toLowerCase()}`]);
			}

			if (operator === '_nieq') {
				dbQuery[logical].whereRaw(`LOWER(??) <> ?`, [selectionRaw, `${compareValue.toLowerCase()}`]);
			}

			if (operator === '_contains') {
				dbQuery[logical].where(selectionRaw, 'like', `%${compareValue}%`);
			}

			if (operator === '_ncontains') {
				dbQuery[logical].whereNot(selectionRaw, 'like', `%${compareValue}%`);
			}

			if (operator === '_icontains') {
				dbQuery[logical].whereRaw(`LOWER(??) LIKE ?`, [selectionRaw, `%${compareValue.toLowerCase()}%`]);
			}

			if (operator === '_nicontains') {
				dbQuery[logical].whereRaw(`LOWER(??) NOT LIKE ?`, [selectionRaw, `%${compareValue.toLowerCase()}%`]);
			}

			if (operator === '_starts_with') {
				dbQuery[logical].where(key, 'like', `${compareValue}%`);
			}

			if (operator === '_nstarts_with') {
				dbQuery[logical].whereNot(key, 'like', `${compareValue}%`);
			}

			if (operator === '_istarts_with') {
				dbQuery[logical].whereRaw(`LOWER(??) LIKE ?`, [selectionRaw, `${compareValue.toLowerCase()}%`]);
			}

			if (operator === '_nistarts_with') {
				dbQuery[logical].whereRaw(`LOWER(??) NOT LIKE ?`, [selectionRaw, `${compareValue.toLowerCase()}%`]);
			}

			if (operator === '_ends_with') {
				dbQuery[logical].where(key, 'like', `%${compareValue}`);
			}

			if (operator === '_nends_with') {
				dbQuery[logical].whereNot(key, 'like', `%${compareValue}`);
			}

			if (operator === '_iends_with') {
				dbQuery[logical].whereRaw(`LOWER(??) LIKE ?`, [selectionRaw, `%${compareValue.toLowerCase()}`]);
			}

			if (operator === '_niends_with') {
				dbQuery[logical].whereRaw(`LOWER(??) NOT LIKE ?`, [selectionRaw, `%${compareValue.toLowerCase()}`]);
			}

			if (operator === '_gt') {
				dbQuery[logical].where(selectionRaw, '>', compareValue);
			}

			if (operator === '_gte') {
				dbQuery[logical].where(selectionRaw, '>=', compareValue);
			}

			if (operator === '_lt') {
				dbQuery[logical].where(selectionRaw, '<', compareValue);
			}

			if (operator === '_lte') {
				dbQuery[logical].where(selectionRaw, '<=', compareValue);
			}

			if (operator === '_in') {
				let value = compareValue;
				if (typeof value === 'string') value = value.split(',');

				dbQuery[logical].whereIn(selectionRaw, value as string[]);
			}

			if (operator === '_nin') {
				let value = compareValue;
				if (typeof value === 'string') value = value.split(',');

				dbQuery[logical].whereNotIn(selectionRaw, value as string[]);
			}

			if (operator === '_between') {
				let value = compareValue;
				if (typeof value === 'string') value = value.split(',');

				if (value.length !== 2) return;

				dbQuery[logical].whereBetween(selectionRaw, value);
			}

			if (operator === '_nbetween') {
				let value = compareValue;
				if (typeof value === 'string') value = value.split(',');

				if (value.length !== 2) return;

				dbQuery[logical].whereNotBetween(selectionRaw, value);
			}

			if (operator == '_intersects') {
				dbQuery[logical].whereRaw(helpers.st.intersects(key, compareValue));
			}

			if (operator == '_nintersects') {
				dbQuery[logical].whereRaw(helpers.st.nintersects(key, compareValue));
			}

			if (operator == '_intersects_bbox') {
				dbQuery[logical].whereRaw(helpers.st.intersects_bbox(key, compareValue));
			}

			if (operator == '_nintersects_bbox') {
				dbQuery[logical].whereRaw(helpers.st.nintersects_bbox(key, compareValue));
			}
		}
	}
}

export function applySearch(
	knex: Knex,
	schema: SchemaOverview,
	dbQuery: Knex.QueryBuilder,
	searchQuery: string,
	collection: string,
) {
	const { number: numberHelper } = getHelpers(knex);
	const fields = Object.entries(schema.collections[collection]!.fields);

	dbQuery.andWhere(function () {
		let needsFallbackCondition = true;

		fields.forEach(([name, field]) => {
			if (['text', 'string'].includes(field.type)) {
				this.orWhereRaw(`LOWER(??) LIKE ?`, [`${collection}.${name}`, `%${searchQuery.toLowerCase()}%`]);
				needsFallbackCondition = false;
			} else if (isNumericField(field)) {
				const number = parseNumericString(searchQuery);

				if (number === null) {
					return; // unable to parse
				}

				if (numberHelper.isNumberValid(number, field)) {
					numberHelper.addSearchCondition(this, collection, name, number);
					needsFallbackCondition = false;
				}
			} else if (field.type === 'uuid' && isValidUuid(searchQuery)) {
				this.orWhere({ [`${collection}.${name}`]: searchQuery });
				needsFallbackCondition = false;
			}
		});

		if (needsFallbackCondition) {
			this.orWhereRaw('1 = 0');
		}
	});
}

export function applyAggregate(
	schema: SchemaOverview,
	dbQuery: Knex.QueryBuilder,
	aggregate: Aggregate,
	collection: string,
	hasJoins: boolean,
): void {
	for (const [operation, fields] of Object.entries(aggregate)) {
		if (!fields) continue;

		for (const field of fields) {
			if (operation === 'avg') {
				dbQuery.avg(`${collection}.${field}`, { as: `avg->${field}` });
			}

			if (operation === 'avgDistinct') {
				dbQuery.avgDistinct(`${collection}.${field}`, { as: `avgDistinct->${field}` });
			}

			if (operation === 'countAll') {
				dbQuery.count('*', { as: 'countAll' });
			}

			if (operation === 'count') {
				if (field === '*') {
					dbQuery.count('*', { as: 'count' });
				} else {
					dbQuery.count(`${collection}.${field}`, { as: `count->${field}` });
				}
			}

			if (operation === 'countDistinct') {
				if (!hasJoins && schema.collections[collection]?.primary === field) {
					// Optimize to count as primary keys are unique
					dbQuery.count(`${collection}.${field}`, { as: `countDistinct->${field}` });
				} else {
					dbQuery.countDistinct(`${collection}.${field}`, { as: `countDistinct->${field}` });
				}
			}

			if (operation === 'sum') {
				dbQuery.sum(`${collection}.${field}`, { as: `sum->${field}` });
			}

			if (operation === 'sumDistinct') {
				dbQuery.sumDistinct(`${collection}.${field}`, { as: `sumDistinct->${field}` });
			}

			if (operation === 'min') {
				dbQuery.min(`${collection}.${field}`, { as: `min->${field}` });
			}

			if (operation === 'max') {
				dbQuery.max(`${collection}.${field}`, { as: `max->${field}` });
			}
		}
	}
}

export function joinFilterWithCases(filter: Filter | null | undefined, cases: Filter[]) {
	if (cases.length > 0 && !filter) {
		return { _or: cases };
	} else if (filter && cases.length === 0) {
		return filter ?? null;
	} else if (filter && cases.length > 0) {
		return { _and: [filter, { _or: cases }] };
	}

	return null;
}

function getFilterPath(key: string, value: Record<string, any>) {
	const path = [key];
	const childKey = Object.keys(value)[0];

	if (!childKey || (childKey.startsWith('_') === true && !['_none', '_some'].includes(childKey))) {
		return path;
	}

	if (isPlainObject(value)) {
		path.push(...getFilterPath(childKey, Object.values(value)[0]));
	}

	return path;
}

function getOperation(key: string, value: Record<string, any>): { operator: string; value: any } | null {
	if (key.startsWith('_') && !['_and', '_or', '_none', '_some'].includes(key)) {
		return { operator: key, value };
	} else if (!isPlainObject(value)) {
		return { operator: '_eq', value };
	}

	const childKey = Object.keys(value)[0];

	if (childKey) {
		return getOperation(childKey, Object.values(value)[0]);
	}

	return null;
}

function isNumericField(field: FieldOverview): field is FieldOverview & { type: NumericType } {
	return isIn(field.type, NUMERIC_TYPES);
}
