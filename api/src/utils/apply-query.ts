import { QueryBuilder } from 'knex';
import { Query, Filter, Relation } from '../types';
import { schemaInspector } from '../database';
import Knex from 'knex';
import { clone, isPlainObject } from 'lodash';
import { systemRelationRows } from '../database/system-data/relations';

export default async function applyQuery(
	knex: Knex,
	collection: string,
	dbQuery: QueryBuilder,
	query: Query
) {
	if (query.filter) {
		await applyFilter(knex, dbQuery, query.filter, collection);
	}

	if (query.sort) {
		dbQuery.orderBy(query.sort);
	}

	if (typeof query.limit === 'number') {
		dbQuery.limit(query.limit);
	}

	if (query.offset) {
		dbQuery.offset(query.offset);
	}

	if (query.page && query.limit) {
		dbQuery.offset(query.limit * (query.page - 1));
	}

	if (query.single) {
		dbQuery.limit(1).first();
	}

	if (query.search) {
		const columns = await schemaInspector.columnInfo(collection);

		dbQuery.andWhere(function () {
			columns
				/** @todo Check if this scales between SQL vendors */
				.filter(
					(column) =>
						column.type.toLowerCase().includes('text') ||
						column.type.toLowerCase().includes('char')
				)
				.forEach((column) => {
					this.orWhereRaw(`LOWER(??) LIKE ?`, [column.name, `%${query.search!}%`]);
				});
		});
	}
}

export async function applyFilter(
	knex: Knex,
	rootQuery: QueryBuilder,
	rootFilter: Filter,
	collection: string
) {
	const relations: Relation[] = [
		...(await knex.select('*').from('directus_relations')),
		...systemRelationRows,
	];

	addWhereClauses(rootQuery, rootFilter, collection);
	addJoins(rootQuery, rootFilter, collection);

	function addWhereClauses(dbQuery: QueryBuilder, filter: Filter, collection: string) {
		for (const [key, value] of Object.entries(filter)) {
			if (key === '_or') {
				/** @NOTE these callback functions aren't called until Knex runs the query */
				dbQuery.orWhere((subQuery) => {
					value.forEach((subFilter: Record<string, any>) => {
						addWhereClauses(subQuery, subFilter, collection);
					});
				});

				continue;
			}

			if (key === '_and') {
				/** @NOTE these callback functions aren't called until Knex runs the query */
				dbQuery.andWhere((subQuery) => {
					value.forEach((subFilter: Record<string, any>) => {
						addWhereClauses(subQuery, subFilter, collection);
					});
				});

				continue;
			}

			const filterPath = getFilterPath(key, value);
			const { operator: filterOperator, value: filterValue } = getOperation(key, value);

			if (filterPath.length > 1) {
				const columnName = getWhereColumn(filterPath, collection);
				applyFilterToQuery(columnName, filterOperator, filterValue);
			} else {
				applyFilterToQuery(`${collection}.${filterPath[0]}`, filterOperator, filterValue);
			}
		}

		function applyFilterToQuery(key: string, operator: string, compareValue: any) {
			if (operator === '_eq') {
				dbQuery.where({ [key]: compareValue });
			}

			if (operator === '_neq') {
				dbQuery.whereNot({ [key]: compareValue });
			}

			if (operator === '_contains') {
				dbQuery.where(key, 'like', `%${compareValue}%`);
			}

			if (operator === '_ncontains') {
				dbQuery.where(key, 'like', `%${compareValue}%`);
			}

			if (operator === '_gt') {
				dbQuery.where(key, '>', compareValue);
			}

			if (operator === '_gte') {
				dbQuery.where(key, '>=', compareValue);
			}

			if (operator === '_lt') {
				dbQuery.where(key, '<', compareValue);
			}

			if (operator === '_lte') {
				dbQuery.where(key, '<=', compareValue);
			}

			if (operator === '_in') {
				let value = compareValue;
				if (typeof value === 'string') value = value.split(',');

				dbQuery.whereIn(key, value as string[]);
			}

			if (operator === '_nin') {
				let value = compareValue;
				if (typeof value === 'string') value = value.split(',');

				dbQuery.whereNotIn(key, value as string[]);
			}

			if (operator === '_null') {
				dbQuery.whereNull(key);
			}

			if (operator === '_nnull') {
				dbQuery.whereNotNull(key);
			}

			if (operator === '_empty') {
				dbQuery.andWhere((query) => {
					query.whereNull(key);
					query.orWhere(key, '=', '');
				});
			}

			if (operator === '_nempty') {
				dbQuery.andWhere((query) => {
					query.whereNotNull(key);
					query.orWhere(key, '!=', '');
				});
			}

			if (operator === '_between') {
				let value = compareValue;
				if (typeof value === 'string') value = value.split(',');

				dbQuery.whereBetween(key, value);
			}

			if (operator === '_nbetween') {
				let value = compareValue;
				if (typeof value === 'string') value = value.split(',');

				dbQuery.whereNotBetween(key, value);
			}
		}

		function getWhereColumn(path: string[], collection: string) {
			path = clone(path);

			let columnName = '';

			followRelation(path);

			return columnName;

			function followRelation(pathParts: string[], parentCollection: string = collection) {
				const relation = relations.find((relation) => {
					return (
						(relation.many_collection === parentCollection &&
							relation.many_field === pathParts[0]) ||
						(relation.one_collection === parentCollection &&
							relation.one_field === pathParts[0])
					);
				});

				if (!relation) return;

				const isM2O =
					relation.many_collection === parentCollection &&
					relation.many_field === pathParts[0];

				pathParts.shift();

				const parent = isM2O ? relation.one_collection! : relation.many_collection;

				if (pathParts.length === 1) {
					columnName = `${parent}.${pathParts[0]}`;
				}

				if (pathParts.length) {
					followRelation(pathParts, parent);
				}
			}
		}
	}

	/**
	 * @NOTE Yes this is very similar in structure and functionality as the other loop. However,
	 * due to the order of execution that Knex has in the nested andWhere / orWhere structures,
	 * joins that are added in there aren't added in time
	 */
	function addJoins(dbQuery: QueryBuilder, filter: Filter, collection: string) {
		for (const [key, value] of Object.entries(filter)) {
			if (key === '_or') {
				value.forEach((subFilter: Record<string, any>) => {
					addJoins(dbQuery, subFilter, collection);
				});

				continue;
			}

			if (key === '_and') {
				value.forEach((subFilter: Record<string, any>) => {
					addJoins(dbQuery, subFilter, collection);
				});

				continue;
			}

			const filterPath = getFilterPath(key, value);

			if (filterPath.length > 1) {
				addJoin(filterPath, collection);
			}
		}

		function addJoin(path: string[], collection: string) {
			path = clone(path);

			followRelation(path);

			function followRelation(pathParts: string[], parentCollection: string = collection) {
				const relation = relations.find((relation) => {
					return (
						(relation.many_collection === parentCollection &&
							relation.many_field === pathParts[0]) ||
						(relation.one_collection === parentCollection &&
							relation.one_field === pathParts[0])
					);
				});

				if (!relation) return;

				const isM2O =
					relation.many_collection === parentCollection &&
					relation.many_field === pathParts[0];

				if (isM2O) {
					dbQuery.leftJoin(
						relation.one_collection!,
						`${parentCollection}.${relation.many_field}`,
						`${relation.one_collection}.${relation.one_primary}`
					);
				} else {
					dbQuery.leftJoin(
						relation.many_collection,
						`${parentCollection}.${relation.one_primary}`,
						`${relation.many_collection}.${relation.many_field}`
					);
				}

				pathParts.shift();

				const parent = isM2O ? relation.one_collection! : relation.many_collection;

				if (pathParts.length) {
					followRelation(pathParts, parent);
				}
			}
		}
	}
}

function getFilterPath(key: string, value: Record<string, any>) {
	const path = [key];

	if (Object.keys(value)[0].startsWith('_') === true) {
		return path;
	}

	if (isPlainObject(value)) {
		path.push(...getFilterPath(Object.keys(value)[0], Object.values(value)[0]));
	}

	return path;
}

function getOperation(key: string, value: Record<string, any>): { operator: string; value: any } {
	if (key.startsWith('_') && key !== '_and' && key !== '_or') {
		return { operator: key as string, value };
	} else if (isPlainObject(value) === false) {
		return { operator: '_eq', value };
	}

	return getOperation(Object.keys(value)[0], Object.values(value)[0]);
}
