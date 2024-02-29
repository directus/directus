import { tableIndexToIdentifier, type AbstractSqlQueryTargetNode } from '@directus/data-sql';
import { wrapColumn } from './wrap-column.js';
import {
	applyJsonPathAsGeometry,
	applyJsonPathAsNumber,
	applyJsonPathAsObject,
	applyJsonPathAsString,
} from './json-path.js';
import { applyFunction } from './functions.js';

/**
 *
 * @param targetNode
 * @param cast if the target node is json, there might be casting needed
 * @returns
 */
export function convertTarget(targetNode: AbstractSqlQueryTargetNode, cast?: 'number' | 'geo' | 'object'): string {
	const tableAlias = tableIndexToIdentifier(targetNode.tableIndex);
	const wrappedColumn = wrapColumn(tableAlias, targetNode.columnName);

	if (targetNode.type === 'primitive') {
		return wrappedColumn;
	} else if (targetNode.type === 'json') {
		if (cast === 'number') {
			return applyJsonPathAsNumber(wrappedColumn, targetNode.path);
		} else if (cast === 'geo') {
			return applyJsonPathAsGeometry(wrappedColumn, targetNode.path);
		} else if (cast === 'object') {
			return applyJsonPathAsObject(wrappedColumn, targetNode.path);
		} else {
			return applyJsonPathAsString(wrappedColumn, targetNode.path);
		}
	} else if (targetNode.type === 'fn') {
		return applyFunction(targetNode);
	} else {
		throw new Error('The specified target node type is not supported!');
	}
}
