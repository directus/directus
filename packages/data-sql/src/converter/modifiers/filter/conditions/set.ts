import type { ConditionSetNode } from '@directus/data';
import type { AbstractSqlQuery } from '../../../../types.js';
import { convertPrimitive } from './utils.js';

export function convertSetCondition(
	node: ConditionSetNode,
	collection: string,
	generator: Generator,
	negate: boolean,
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> {
	return {
		where: {
			type: 'condition',
			negate,
			condition: {
				type: 'condition-set',
				operation: node.operation,
				target: convertPrimitive(collection, node.target),
				compareTo: {
					type: 'values',
					parameterIndexes: Array.from(node.compareTo).map(() => generator.next().value),
				},
			},
		},
		parameters: [...node.compareTo],
	};
}
