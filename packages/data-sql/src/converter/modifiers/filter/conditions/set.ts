import type { ConditionSetNode } from '@directus/data';
import type { WhereUnion } from '../../../../types/index.js';
import { convertPrimitive } from './utils.js';

export function convertSetCondition(
	node: ConditionSetNode,
	collection: string,
	generator: Generator<number, number, number>,
	negate: boolean
): WhereUnion {
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
