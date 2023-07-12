import type { AbstractSqlQuery } from '@directus/data-sql';
import { wrapColumn } from '../utils/wrap-column.js';
import { convertCount } from '../utils/functions.js';

/**
 * Generates the `SELECT x, y` part of a SQL statement.
 * The fields are always prefixed with the table name.
 *
 * @param AbstractSqlQuery the whole query object
 * @returns the `SELECT x, y` part of a SQL statement
 */
export const select = ({ select }: AbstractSqlQuery): string => {
	const escapedColumns = select.map((node) => {
		if (node.type === 'primitive') {
			return wrapColumn(node.table, node.column, node.as);
		}

		if (node.type === 'fn') {
			return convertCount(node);
		}
	});

	return `SELECT ${escapedColumns.join(', ')}`;
};
