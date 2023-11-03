import type { ConditionStringNode } from '@directus/data';
import { convertTarget } from './utils.js';
import type { FilterResult } from '../filter.js';

export function convertStringNode(
	node: ConditionStringNode,
	collection: string,
	generator: Generator<number, number, number>,
	negate: boolean
): FilterResult {
	const convertedTarget = convertTarget(node.target, collection, generator);

	const where = {
		type: 'condition',
		negate,
		condition: {
			type: node.type,
			operation: node.operation,
			target: convertedTarget.value,
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
			joins: convertedTarget.joins,
		},
		parameters,
	};
}
