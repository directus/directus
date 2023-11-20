import type { ConditionFieldNode } from '@directus/data';
import type { FilterResult } from '../utils.js';
import { convertTarget } from '../../target.js';

export function convertFieldCondition(
	node: ConditionFieldNode,
	collection: string,
	generator: Generator<number, number, number>,
	negate: boolean,
): FilterResult {
	const { value: value1, joins: joins1 } = convertTarget(node.target, collection, generator);
	const { value: value2, joins: joins2 } = convertTarget(node.compareTo, collection, generator);

	return {
		clauses: {
			where: {
				type: 'condition',
				negate,
				condition: {
					type: 'condition-field',
					operation: node.operation,
					target: value1,
					compareTo: value2,
				},
			},
			joins: [...joins1, ...joins2],
		},
		parameters: [],
	};
}
