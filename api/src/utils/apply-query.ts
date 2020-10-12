import { QueryBuilder } from 'knex';
import { Query, Filter } from '../types';
import database, { schemaInspector } from '../database';
import { clone } from 'lodash';

export default async function applyQuery(collection: string, dbQuery: QueryBuilder, query: Query) {
	if (query.filter) {
		await applyFilter(dbQuery, query.filter, collection);
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

export async function applyFilter(dbQuery: QueryBuilder, filter: Filter, collection: string) {
	for (const [key, value] of Object.entries(filter)) {
		if (key === '_or') {
			value.forEach((subFilter: Record<string, any>) => {
				dbQuery.orWhere((subQuery) => applyFilter(subQuery, subFilter, collection));
			});

			continue;
		}

		if (key === '_and') {
			value.forEach((subFilter: Record<string, any>) => {
				dbQuery.andWhere((subQuery) => applyFilter(subQuery, subFilter, collection));
			});

			continue;
		}

		const filterPath = getFilterPath(key, value);
		const { operator: filterOperator, value: filterValue } = getOperation(key, value);

		const column =
			filterPath.length > 1
				? await applyJoins(dbQuery, filterPath, collection)
				: `${collection}.${filterPath[0]}`;

		applyFilterToQuery(column, filterOperator, filterValue);
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
}

function getFilterPath(key: string, value: Record<string, any>) {
	const path = [key];

	if (Object.keys(value)[0].startsWith('_') === false) {
		path.push(...getFilterPath(Object.keys(value)[0], Object.values(value)[0]));
	}

	return path;
}

function getOperation(key: string, value: Record<string, any>): { operator: string; value: any } {
	if (key.startsWith('_') && key !== '_and' && key !== '_or')
		return { operator: key as string, value };
	return getOperation(Object.keys(value)[0], Object.values(value)[0]);
}

async function applyJoins(dbQuery: QueryBuilder, path: string[], collection: string) {
	path = clone(path);

	let keyName = '';

	await addJoins(path);

	return keyName;

	async function addJoins(pathParts: string[], parentCollection: string = collection) {
		const relation = await database
			.select('*')
			.from('directus_relations')
			.where({ one_collection: parentCollection, one_field: pathParts[0] })
			.orWhere({ many_collection: parentCollection, many_field: pathParts[0] })
			.first();

		if (!relation) return;

		const isM2O =
			relation.many_collection === parentCollection && relation.many_field === pathParts[0];

		if (isM2O) {
			dbQuery.leftJoin(
				relation.one_collection,
				`${parentCollection}.${relation.many_field}`,
				`${relation.one_collection}.${relation.one_primary}`
			);
		} else {
			dbQuery.leftJoin(
				relation.many_collection,
				`${relation.one_collection}.${relation.one_primary}`,
				`${relation.many_collection}.${relation.many_field}`
			);
		}

		pathParts.shift();

		const parent = isM2O ? relation.one_collection : relation.many_collection;

		if (pathParts.length === 1) {
			keyName = `${parent}.${pathParts[0]}`;
		}

		if (pathParts.length) {
			await addJoins(pathParts, parent);
		}
	}
}
