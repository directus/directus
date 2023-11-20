import type { ConditionSetNode } from '@directus/data';
import { convertTarget } from '../../target.js';
import type { FilterResult } from '../utils.js';

export function convertSetCondition(
	node: ConditionSetNode,
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
					type: 'condition-set',
					operation: node.operation,
					target: value,
					compareTo: {
						type: 'values',
						parameterIndexes: Array.from(node.compareTo).map(() => generator.next().value),
					},
				},
			},
			joins,
		},
		parameters: [...node.compareTo],
	};
}
