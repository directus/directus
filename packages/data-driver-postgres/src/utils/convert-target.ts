import { tableIndexToIdentifier, type AbstractSqlQueryTargetNode } from '@directus/data-sql';
import { wrapColumn } from './wrap-column.js';
import {
	applyJsonPathAsGeometry,
	applyJsonPathAsNumber,
	applyJsonPathAsObject,
	applyJsonPathAsString,
} from './json-path.js';
import { applyFunction } from './functions.js';

type conditionNodeTypes = 'number' | 'geo' | 'object';

/**
 *
 * @param targetNode
 * @param cast if the target node is json, there might be casting needed
 * @returns
 */
export function convertTarget(targetNode: AbstractSqlQueryTargetNode, cast?: conditionNodeTypes): string {
	const tableAlias = tableIndexToIdentifier(targetNode.tableIndex);
	const wrappedColumn = wrapColumn(tableAlias, targetNode.columnName);

	if (targetNode.type === 'primitive') {
		return wrappedColumn;
	} else if (targetNode.type === 'json') {
		const isForType = (type: string): boolean => cast === type || targetNode.dataType === type;

		if (isForType('number')) {
			return applyJsonPathAsNumber(wrappedColumn, targetNode.path, targetNode.pathIsIndex);
		} else if (isForType('geo')) {
			return applyJsonPathAsGeometry(wrappedColumn, targetNode.path);
		} else if (isForType('object')) {
			return applyJsonPathAsObject(wrappedColumn, targetNode.path);
		} else {
			return applyJsonPathAsString(wrappedColumn, targetNode.path, targetNode.pathIsIndex);
		}
	} else if (targetNode.type === 'fn') {
		return applyFunction(targetNode);
	} else {
		throw new Error('The specified target node type is not supported!');
	}
}
