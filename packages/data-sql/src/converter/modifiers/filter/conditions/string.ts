import type { ConditionStringNode } from '@directus/data';
import type { WhereUnion } from '../../../../types/index.js';
import { convertPrimitive } from './utils.js';

export function convertStringNode(
	node: ConditionStringNode,
	collection: string,
	generator: Generator<number, number, number>,
	negate: boolean
): WhereUnion {
	return {
		where: {
			type: 'condition',
			negate,
			condition: {
				type: node.type,
				operation: node.operation,
				target: convertPrimitive(collection, node.target),
				compareTo: {
					type: 'value',
					parameterIndex: generator.next().value,
				},
			},
		},
		parameters: [node.compareTo],
	};
}
