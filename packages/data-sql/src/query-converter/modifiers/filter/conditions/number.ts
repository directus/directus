import type { ConditionNumberNode } from '@directus/data';
import { convertTarget } from './utils.js';
import type { FilterResult } from '../filter.js';

export function convertNumberNode(
	node: ConditionNumberNode,
	collection: string,
	generator: Generator<number, number, number>,
	negate: boolean
): FilterResult {
	const convertedTarget = convertTarget(node, collection, generator);

	const where = {
		type: 'condition',
		negate,
		condition: {
			type: node.type,
			operation: node.operation,
			target: convertedTarget.target,
			compareTo: {
				type: 'value',
				parameterIndex: generator.next().value,
			},
		},
	};

	const parameters = [node.compareTo];

	return {
		clauses: {
			where,
			joins: [],
		},
		parameters,
	};
}
