import type { ConditionFieldNode } from '@directus/data';
import type { IndexGenerators } from '../../../../utils/create-index-generators.js';
import { convertTarget } from '../../target.js';
import type { FilterResult } from '../utils.js';

export function convertFieldCondition(
	node: ConditionFieldNode,
	collection: string,
	indexGen: IndexGenerators,
	negate: boolean,
): FilterResult {
	const { value: value1, joins: joins1 } = convertTarget(node.target, collection, indexGen);
	const { value: value2, joins: joins2 } = convertTarget(node.compareTo, collection, indexGen);

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
