import type { SqlStatement } from '@directus/data-sql';
import { from } from './from.js';
import { select } from './select.js';
import type { ParameterizedSQLStatement } from '@directus/data-sql';
import { limitOffset } from './limit-offset.js';

/**
 * All of the sub functions are called for any query.
 * Within those functions checks are being made, if the part can or should be included within the statement.
 *
 * @param query the abstract SQL statement
 * @returns An actual SQL with parameters
 */
export function constructSql(query: SqlStatement): ParameterizedSQLStatement {
	const base = [select(query), from(query)].join(' ');

	const limitOffsetPart = limitOffset(query);

	return {
		statement: `${base} ${limitOffsetPart}`.trimEnd() + ';',
		values: query.parameters,
	};
}
