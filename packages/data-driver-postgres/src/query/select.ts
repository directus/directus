import type { AbstractSqlClauses } from '@directus/data-sql';
import { wrapColumn } from '../utils/wrap-column.js';
import { applyFunction } from '../utils/functions.js';

/**
 * Generates the `SELECT x, y` part of a SQL statement.
 * The fields are always prefixed with the table name.
 *
 * @param AbstractSqlQuery the whole query object
 * @returns the `SELECT x, y` part of a SQL statement
 */
export const select = ({ select }: AbstractSqlClauses): string => {
	const escapedColumns = select.map((selectNode) => {
		if (selectNode.type === 'primitive') {
			return wrapColumn(selectNode.table, selectNode.column, selectNode.as);
		}

		if (selectNode.type === 'fn') {
			return applyFunction(selectNode);
		}

		throw Error(`Unknown node type`);
	});

	return `SELECT ${escapedColumns.join(', ')}`;
};
