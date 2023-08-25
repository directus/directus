import type { AbstractQueryFieldNodePrimitive, ActualConditionNodes } from '@directus/data';
import type { ParameterTypes, AbstractSqlQueryFnNode, AbstractSqlQuerySelectNode } from '../../../../types/index.js';
import { convertFn } from '../../../functions.js';

/**
 * It adds the table name to the node.
 * @param collection
 * @param primitiveNode
 * @returns an unambitious column
 */
export function convertPrimitive(
	collection: string,
	primitiveNode: AbstractQueryFieldNodePrimitive
): AbstractSqlQuerySelectNode {
	return {
		type: 'primitive',
		table: collection,
		column: primitiveNode.field,
	};
}

export function convertTarget(
	condition: ActualConditionNodes,
	collection: string,
	generator: Generator
): AbstractSqlQueryFnNode | AbstractSqlQuerySelectNode {
	let target: AbstractSqlQueryFnNode | AbstractSqlQuerySelectNode;
	const parameters: ParameterTypes[] = [];

	if (condition.target.type === 'primitive') {
		target = {
			type: 'primitive',
			table: collection,
			column: condition.target.field,
		};
	} else if (condition.target.type === 'fn') {
		const convertedFn = convertFn(collection, condition.target, generator);
		target = convertedFn.fn;
		parameters.push(...convertedFn.parameters);
	} else {
		throw new Error('The related field types are not yet supported.');
	}

	return target;
}
