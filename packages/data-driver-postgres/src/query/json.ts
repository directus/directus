import {
	tableIndexToIdentifier,
	type AbstractSqlQuerySelectJsonNode,
	columnIndexToIdentifier,
} from '@directus/data-sql';
import { escapeIdentifier } from '../utils/escape-identifier.js';

export function json(node: AbstractSqlQuerySelectJsonNode): string {
	const tableAlias = tableIndexToIdentifier(node.tableIndex);
	const columnAlias = columnIndexToIdentifier(node.columnIndex);
	const column = `${escapeIdentifier(tableAlias)}.${escapeIdentifier(node.columnName)}`;
	return `${column} -> ${node.path.map((i) => escapeIdentifier(i)).join(` ->> `)} AS ${escapeIdentifier(columnAlias)}`;
}
