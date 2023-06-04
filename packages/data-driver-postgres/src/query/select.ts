import type { SqlStatement } from '@directus/data-sql';
import { wrapColumn } from '../utils/wrap-column.js';
import { escapeIdentifier } from '../utils/escape-identifier.js';

/**
 * Generates the `SELECT x, y` part of a SQL statement.
 * The fields are always prefixed with the table name.
 */
export const select = (statement: SqlStatement): string => {
	if (statement.select.length === 0) {
		return `SELECT ${escapeIdentifier(statement.from)}.*`;
	}

	const escapedColumns = statement.select.map(({ table, column, as }) => wrapColumn(table, column, as));
	return `SELECT ${escapedColumns.join(', ')}`;
};
