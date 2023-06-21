import type { AbstractSqlQuery } from '@directus/data-sql';
import { from } from './from.js';
import { select } from './select.js';
import type { ParameterizedSQLStatement } from '@directus/data-sql';
import { limit } from './limit.js';
import { offset } from './offset.js';
import { orderBy } from './orderBy.js';

/**
 * Constructs an actual PostgreSQL query statement from a given abstract SQL query.
 *
 * @remarks
 * To create a PostgreSQL statement each part is constructed in a separate function.
 * In those functions it will be checked if the part should actually be created.
 * If not, the functions return null.
 *
 * @param query - The abstract SQL statement
 * @returns An actual SQL query with parameters
 */
export function constructSqlQuery(query: AbstractSqlQuery): ParameterizedSQLStatement {
	const base = [select(query), from(query)].join(' ');

	const orderByPart = orderBy(query);

	const limitPart = limit(query);
	const offsetPart = offset(query);

	const actualParts = [base, orderByPart, limitPart, offsetPart].filter((p) => p !== null);

	return {
		statement: actualParts.join(' ').trim() + ';',
		parameters: query.parameters,
	};
}
