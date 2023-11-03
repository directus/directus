import type { ConditionSetNode } from '@directus/data';
import { convertTarget } from './utils.js';
import type { FilterResult } from '../filter.js';

export function convertSetCondition(
	node: ConditionSetNode,
	collection: string,
	generator: Generator<number, number, number>,
	negate: boolean
): FilterResult {
	const convertedTarget = convertTarget(node.target, collection, generator);

	const where = {
		type: 'condition',
		negate,
		condition: {
			type: 'condition-set',
			operation: node.operation,
			target: convertedTarget.value,
			compareTo: {
				type: 'values',
				parameterIndexes: Array.from(node.compareTo).map(() => generator.next().value),
			},
		},
	};

	const parameters = [...node.compareTo];

	return {
		clauses: {
			where,
			joins: [],
		},
		parameters,
	};
}
