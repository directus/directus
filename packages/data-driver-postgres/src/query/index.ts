import type { AbstractSqlQuery } from '@directus/data-sql';
import { from } from './from.js';
import { select } from './select.js';
import type { ParameterizedSQLStatement } from '@directus/data-sql';
import { limit } from './limit.js';
import { offset } from './offset.js';
import { where } from './where.js';

/**
 * Constructs an actual PostgreSQL query statement from a given abstract SQL query.
 *
 * @param query - The abstract SQL statement
 * @returns An actual SQL with parameters
 */
export function constructSqlQuery(query: AbstractSqlQuery): ParameterizedSQLStatement {
	const statementParts = [select, from, where, limit, offset];

	const statement = `${statementParts
		.map((part) => part(query))
		.filter((p) => p !== null)
		.join(' ')
		.trim()};`;

	return {
		statement,
		parameters: query.parameters,
	};
}
