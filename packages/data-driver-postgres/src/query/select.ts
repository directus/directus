import {
	columnIndexToIdentifier,
	tableIndexToIdentifier,
	type AbstractSqlClauses,
	type AbstractSqlQuerySelectJsonNode,
} from '@directus/data-sql';
import { escapeIdentifier } from '../utils/escape-identifier.js';
import { applySelectFunction } from '../utils/functions.js';
import { wrapColumn } from '../utils/wrap-column.js';

/**
 * Generates the `SELECT x, y` part of a SQL statement.
 * The fields are always prefixed with the table name.
 *
 * @param query - The whole abstract SQL query
 * @returns the `SELECT x, y` part of a SQL statement
 */
export const select = ({ select }: AbstractSqlClauses): string => {
	const escapedColumns = select.map((selectNode) => {
		if (selectNode.type === 'primitive') {
			const tableAlias = tableIndexToIdentifier(selectNode.tableIndex);
			const columnAlias = columnIndexToIdentifier(selectNode.columnIndex);

			return wrapColumn(tableAlias, selectNode.columnName, columnAlias);
		}

		if (selectNode.type === 'fn') {
			return applySelectFunction(selectNode);
		}

		if (selectNode.type === 'json') {
			return json(selectNode);
		}

		throw Error(`Unknown node type`);
	});

	return `SELECT ${escapedColumns.join(', ')}`;
};

export function json(node: AbstractSqlQuerySelectJsonNode): string {
	const tableAlias = tableIndexToIdentifier(node.tableIndex);
	const columnAlias = columnIndexToIdentifier(node.columnIndex);

	const column = `${escapeIdentifier(tableAlias)}.${escapeIdentifier(node.columnName)}`;

	return `${column} -> ${node.path.map((i) => `$${i + 1}`).join(` -> `)} AS ${escapeIdentifier(columnAlias)}`;
}
