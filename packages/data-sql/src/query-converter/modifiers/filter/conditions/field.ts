import type { ConditionFieldNode } from '@directus/data';
import { convertPrimitive } from './utils.js';
import type { FilterResult } from '../filter.js';

export function convertFieldCondition(node: ConditionFieldNode, collection: string, negate: boolean): FilterResult {
	const where = {
		type: 'condition',
		negate,
		condition: {
			type: 'condition-field',
			operation: node.operation,
			target: convertPrimitive(collection, node.target),
			compareTo: convertPrimitive(collection, node.compareTo),
		},
	};

	return {
		clauses: {
			where,
			joins: [],
		},
		parameters: [],
	};
}
