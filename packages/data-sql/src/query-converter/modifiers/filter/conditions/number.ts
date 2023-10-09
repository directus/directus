import type { ConditionNumberNode } from '@directus/data';
import type { WhereUnion } from '../../../../types/index.js';
import { convertTarget } from './utils.js';

export function convertNumberNode(
	node: ConditionNumberNode,
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
				target: convertTarget(node, collection, generator),
				compareTo: {
					type: 'value',
					parameterIndex: generator.next().value,
				},
			},
		},
		parameters: [node.compareTo],
	};
}
