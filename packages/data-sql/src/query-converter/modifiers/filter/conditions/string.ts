import type { ConditionStringNode } from '@directus/data';
import { convertTarget } from '../../target.js';
import type { FilterResult } from '../utils.js';

export function convertStringNode(
	node: ConditionStringNode,
	collection: string,
	generator: Generator<number, number, number>,
	negate: boolean,
): FilterResult {
	const { value, joins } = convertTarget(node.target, collection, generator);

	return {
		clauses: {
			where: {
				type: 'condition',
				negate,
				condition: {
					type: node.type,
					operation: node.operation,
					target: value,
					compareTo: {
						type: 'value',
						parameterIndex: generator.next().value,
					},
				},
			},
			joins,
		},
		parameters: [node.compareTo],
	};
}
