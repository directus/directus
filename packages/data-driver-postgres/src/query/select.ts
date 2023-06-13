import type { SqlStatement } from '@directus/data-sql';
import { wrapColumn } from '../utils/wrap-column.js';

/**
 * Generates the `SELECT x, y` part of a SQL statement.
 * The fields are always prefixed with the table name.
 */
export const select = ({ select }: SqlStatement): string => {
	const escapedColumns = select.map(({ table, column, as }) => wrapColumn(table, column, as));
	return `SELECT ${escapedColumns.join(', ')}`;
};
