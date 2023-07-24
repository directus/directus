import type { ConditionFieldNode } from '@directus/data';
import type { AbstractSqlQuery } from '../../../../types.js';
import { convertPrimitive } from './utils.js';

export function convertFieldCondition(
	node: ConditionFieldNode,
	collection: string,
	negate: boolean
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> {
	return {
		where: {
			type: 'condition',
			negate,
			condition: {
				type: 'condition-field',
				operation: node.operation,
				target: convertPrimitive(collection, node.target),
				compareTo: convertPrimitive(node.compareTo.collection, node.compareTo),
			},
		},
		parameters: [],
	};
}
