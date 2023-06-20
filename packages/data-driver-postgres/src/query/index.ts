import type { AbstractSqlQuery } from '@directus/data-sql';
import { from } from './from.js';
import { select } from './select.js';
import type { ParameterizedSQLStatement } from '@directus/data-sql';
import { limit } from './limit.js';
import { offset } from './offset.js';

/**
 * Constructs an actual PostgreSQL query statement from a given abstract SQL query.
 *
 * @param query - The abstract SQL statement
 * @returns An actual SQL with parameters
 */
export function constructSqlQuery(query: AbstractSqlQuery): ParameterizedSQLStatement {
	const base = [select(query), from(query)].join(' ');

	const limitPart = limit(query);
	const offsetPart = offset(query);

	return {
		statement: `${base} ${limitPart} ${offsetPart}`.trimEnd() + ';',
		parameters: query.parameters,
	};
}
