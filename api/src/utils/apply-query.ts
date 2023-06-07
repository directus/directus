import type {
	Aggregate,
	ClientFilterOperator,
	FieldFunction,
	FieldOverview,
	Filter,
	Query,
	Relation,
	SchemaOverview,
	Type,
} from '@directus/types';
import { getFilterOperatorsForType, getOutputTypeForFunction } from '@directus/utils';
import type { Knex } from 'knex';
import { clone, isPlainObject } from 'lodash-es';
import validate from 'uuid-validate';
import { getHelpers } from '../database/helpers/index.js';
import { InvalidQueryException } from '../exceptions/invalid-query.js';
import type { AliasMap } from './get-column-path.js';
import { getColumnPath } from './get-column-path.js';
import { getColumn } from './get-column.js';
import { getRelationInfo } from './get-relation-info.js';
import { stripFunction } from './strip-function.js';

// @ts-ignore
import { customAlphabet } from 'nanoid/non-secure';

export const generateAlias = customAlphabet('abcdefghijklmnopqrstuvwxyz', 5);

/**
 * Apply the Query to a given Knex query builder instance
 */
export default function applyQuery(
	knex: Knex,
	collection: string,
	dbQuery: Knex.QueryBuilder,
	query: Query,
	schema: SchemaOverview,
	options?: { aliasMap?: AliasMap; isInnerQuery?: boolean; hasMultiRelationalSort?: boolean | undefined }
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
		const sortResult = applySort(knex, schema, dbQuery, query.sort, collection, aliasMap);

		if (!hasJoins) {
			hasJoins = sortResult.hasJoins;
		}
	}

	if (query.search) {
		applySearch(schema, dbQuery, query.search, collection);
	}

	if (query.group) {
		dbQuery.groupBy(query.group.map((column) => getColumn(knex, collection, column, false, schema)));
	}

	if (query.filter) {
		const filterResult = applyFilter(knex, schema, dbQuery, query.filter, collection, aliasMap);

		if (!hasJoins) {
			hasJoins = filterResult.hasJoins;
		}

		hasMultiRelationalFilter = filterResult.hasMultiRelationalFilter;
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
					`${alias}.${schema.collections[relation.related_collection!]!.primary}`
				);

				aliasMap[aliasKey]!.collection = relation.related_collection!;

				isJoinAdded = true;
			} else if (relationType === 'a2o') {
				const pathScope = pathParts[0]!.split(':')[1];

				if (!pathScope) {
					throw new InvalidQueryException(
						`You have to provide a collection scope when sorting or filtering on a many-to-any item`
					);
				}

				rootQuery.leftJoin({ [alias]: pathScope }, (joinClause) => {
					joinClause
						.onVal(relation.meta!.one_collection_field!, '=', pathScope)
						.andOn(
							`${aliasedParentCollection}.${relation.field}`,
							'=',
							knex.raw(
								getHelpers(knex).schema.castA2oPrimaryKey(),
								`${alias}.${schema.collections[pathScope]!.primary}`
							)
						);
				});

				aliasMap[aliasKey]!.collection = pathScope;

				isJoinAdded = true;
			} else if (relationType === 'o2a') {
				rootQuery.leftJoin({ [alias]: relation.collection }, (joinClause) => {
					joinClause
						.onVal(relation.meta!.one_collection_field!, '=', parentCollection)
						.andOn(
							`${alias}.${relation.field}`,
							'=',
							knex.raw(
								getHelpers(knex).schema.castA2oPrimaryKey(),
								`${aliasedParentCollection}.${schema.collections[parentCollection]!.primary}`
							)
						);
				});

				aliasMap[aliasKey]!.collection = relation.collection;

				hasMultiRelational = true;
				isJoinAdded = true;
			} else if (relationType === 'o2m') {
				rootQuery.leftJoin(
					{ [alias]: relation.collection },
					`${aliasedParentCollection}.${schema.collections[relation.related_collection!]!.primary}`,
					`${alias}.${relation.field}`
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
				throw new InvalidQueryException(
					`You have to provide a collection scope when sorting or filtering on a many-to-any item`
				);
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
	rootSort: string[],
	collection: string,
	aliasMap: AliasMap,
	returnRecords = false
) {
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
	aliasMap: AliasMap
) {
	const helpers = getHelpers(knex);
	const relations: Relation[] = schema.relations;
	let hasJoins = false;
	let hasMultiRelationalFilter = false;

	addJoins(rootQuery, rootFilter, collection);
	addWhereClauses(knex, rootQuery, rootFilter, collection);

	return { query: rootQuery, hasJoins, hasMultiRelationalFilter };

	function addJoins(dbQuery: Knex.QueryBuilder, filter: Filter, collection: string) {
		for (const [key, value] of Object.entries(filter)) {
			if (key === '_or' || key === '_and') {
				// If the _or array contains an empty object (full permissions), we should short-circuit and ignore all other
				// permission checks, as {} already matches full permissions.
				if (key === '_or' && value.some((subFilter: Record<string, any>) => Object.keys(subFilter).length === 0)) {
					continue;
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
		logical: 'and' | 'or' = 'and'
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

			const { operator: filterOperator, value: filterValue } = getOperation(key, value);

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

					const subQueryBuilder = (filter: Filter) => (subQueryKnex: Knex.QueryBuilder<any, unknown[]>) => {
						const field = relation!.field;
						const collection = relation!.collection;
						const column = `${collection}.${field}`;

						subQueryKnex
							.select({ [field]: column })
							.from(collection)
							.whereNotNull(column);

						applyQuery(knex, relation!.collection, subQueryKnex, { filter }, schema);
					};

					const childKey = Object.keys(value)?.[0];

					if (childKey === '_none') {
						dbQuery[logical].whereNotIn(pkField as string, subQueryBuilder(Object.values(value)[0] as Filter));
						continue;
					} else if (childKey === '_some') {
						dbQuery[logical].whereIn(pkField as string, subQueryBuilder(Object.values(value)[0] as Filter));
						continue;
					}
				}

				if (filterPath.includes('_none') || filterPath.includes('_some')) {
					throw new InvalidQueryException(
						`"${
							filterPath.includes('_none') ? '_none' : '_some'
						}" can only be used with top level relational alias field`
					);
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

				const { type, special } = validateFilterField(
					schema.collections[targetCollection]!.fields,
					stripFunction(filterPath[filterPath.length - 1]!),
					targetCollection
				)!;

				validateFilterOperator(type, filterOperator, special);

				applyFilterToQuery(columnPath, filterOperator, filterValue, logical, targetCollection);
			} else {
				const { type, special } = validateFilterField(
					schema.collections[collection]!.fields,
					stripFunction(filterPath[0]!),
					collection
				)!;

				validateFilterOperator(type, filterOperator, special);

				applyFilterToQuery(`${collection}.${filterPath[0]}`, filterOperator, filterValue, logical);
			}
		}

		function validateFilterField(fields: Record<string, FieldOverview>, key: string, collection = 'unknown') {
			if (fields[key] === undefined) {
				throw new InvalidQueryException(`Invalid filter key "${key}" on "${collection}"`);
			}

			return fields[key];
		}

		function validateFilterOperator(type: Type, filterOperator: string, special: string[]) {
			if (filterOperator.startsWith('_')) {
				filterOperator = filterOperator.slice(1);
			}

			if (!getFilterOperatorsForType(type).includes(filterOperator as ClientFilterOperator)) {
				throw new InvalidQueryException(
					`"${type}" field type does not contain the "_${filterOperator}" filter operator`
				);
			}

			if (
				special.includes('conceal') &&
				!getFilterOperatorsForType('hash').includes(filterOperator as ClientFilterOperator)
			) {
				throw new InvalidQueryException(
					`Field with "conceal" special does not allow the "_${filterOperator}" filter operator`
				);
			}
		}

		function applyFilterToQuery(
			key: string,
			operator: string,
			compareValue: any,
			logical: 'and' | 'or' = 'and',
			originalCollectionName?: string
		) {
			const [table, column] = key.split('.');

			// Is processed through Knex.Raw, so should be safe to string-inject into these where queries
			const selectionRaw = getColumn(knex, table!, column!, false, schema, { originalCollectionName }) as any;

			// Knex supports "raw" in the columnName parameter, but isn't typed as such. Too bad..
			// See https://github.com/knex/knex/issues/4518 @TODO remove as any once knex is updated

			// These operators don't rely on a value, and can thus be used without one (eg `?filter[field][_null]`)
			if (operator === '_null' || (operator === '_nnull' && compareValue === false)) {
				dbQuery[logical].whereNull(selectionRaw);
			}

			if (operator === '_nnull' || (operator === '_null' && compareValue === false)) {
				dbQuery[logical].whereNotNull(selectionRaw);
			}

			if (operator === '_empty' || (operator === '_nempty' && compareValue === false)) {
				dbQuery[logical].andWhere((query) => {
					query.whereNull(key).orWhere(key, '=', '');
				});
			}

			if (operator === '_nempty' || (operator === '_empty' && compareValue === false)) {
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

				if (['bigInteger', 'integer', 'float', 'decimal'].includes(type)) {
					compareValue = Number(compareValue);
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

				if (['bigInteger', 'integer', 'float', 'decimal'].includes(type)) {
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
				if (compareValue.length !== 2) return;

				let value = compareValue;
				if (typeof value === 'string') value = value.split(',');

				dbQuery[logical].whereBetween(selectionRaw, value);
			}

			if (operator === '_nbetween') {
				if (compareValue.length !== 2) return;

				let value = compareValue;
				if (typeof value === 'string') value = value.split(',');

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

export async function applySearch(
	schema: SchemaOverview,
	dbQuery: Knex.QueryBuilder,
	searchQuery: string,
	collection: string
): Promise<void> {
	const fields = Object.entries(schema.collections[collection]!.fields);

	dbQuery.andWhere(function () {
		fields.forEach(([name, field]) => {
			if (['text', 'string'].includes(field.type)) {
				this.orWhereRaw(`LOWER(??) LIKE ?`, [`${collection}.${name}`, `%${searchQuery.toLowerCase()}%`]);
			} else if (['bigInteger', 'integer', 'decimal', 'float'].includes(field.type)) {
				const number = Number(searchQuery);

				// only cast finite base10 numeric values
				if (validateNumber(searchQuery, number)) {
					this.orWhere({ [`${collection}.${name}`]: number });
				}
			} else if (field.type === 'uuid' && validate(searchQuery)) {
				this.orWhere({ [`${collection}.${name}`]: searchQuery });
			}
		});
	});
}

function validateNumber(value: string, parsed: number) {
	if (isNaN(parsed) || !Number.isFinite(parsed)) return false;
	// casting parsed value back to string should be equal the original value
	// (prevent unintended number parsing, e.g. String(7) !== "ob111")
	return String(parsed) === value;
}

export function applyAggregate(
	schema: SchemaOverview,
	dbQuery: Knex.QueryBuilder,
	aggregate: Aggregate,
	collection: string,
	hasJoins: boolean
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

function getFilterPath(key: string, value: Record<string, any>) {
	const path = [key];
	const childKey = Object.keys(value)[0]!;

	if (typeof childKey === 'string' && childKey.startsWith('_') === true && !['_none', '_some'].includes(childKey)) {
		return path;
	}

	if (isPlainObject(value)) {
		path.push(...getFilterPath(childKey, Object.values(value)[0]));
	}

	return path;
}

function getOperation(key: string, value: Record<string, any>): { operator: string; value: any } {
	if (key.startsWith('_') && !['_and', '_or', '_none', '_some'].includes(key)) {
		return { operator: key as string, value };
	} else if (isPlainObject(value) === false) {
		return { operator: '_eq', value };
	}

	return getOperation(Object.keys(value)[0]!, Object.values(value)[0]);
}
