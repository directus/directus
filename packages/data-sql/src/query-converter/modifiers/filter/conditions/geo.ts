import type { ConditionGeoIntersectsNode, ConditionGeoIntersectsBBoxNode } from '@directus/data';
import { convertTarget } from './utils.js';
import type { FilterResult } from '../filter.js';

export function convertGeoCondition(
	node: ConditionGeoIntersectsNode | ConditionGeoIntersectsBBoxNode,
	collection: string,
	generator: Generator<number, number, number>,
	negate: boolean
): FilterResult {
	const convertedTarget = convertTarget(node, collection, generator);

	const where = {
		type: 'condition',
		negate,
		condition: {
			type: 'condition-geo',
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
