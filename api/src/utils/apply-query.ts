import { QueryBuilder } from 'knex';
import { Query, Filter } from '../types';
import { schemaInspector } from '../database';

export default async function applyQuery(collection: string, dbQuery: QueryBuilder, query: Query) {
	if (query.filter) {
		applyFilter(dbQuery, query.filter);
	}

	if (query.sort) {
		dbQuery.orderBy(query.sort);
	}

	if (typeof query.limit === 'number' && !query.offset) {
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

export function applyFilter(dbQuery: QueryBuilder, filter: Filter) {
	for (const [key, value] of Object.entries(filter)) {
		if (key.startsWith('_') === false) {
			let operator = Object.keys(value)[0];

			const compareValue: any = Object.values(value)[0];

			if (compareValue === '') continue;

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

		if (key === '_or') {
			value.forEach((subFilter: Record<string, any>) => {
				dbQuery.orWhere((subQuery) => applyFilter(subQuery, subFilter));
			});
		}

		if (key === '_and') {
			value.forEach((subFilter: Record<string, any>) => {
				dbQuery.andWhere((subQuery) => applyFilter(subQuery, subFilter));
			});
		}
	}
}
