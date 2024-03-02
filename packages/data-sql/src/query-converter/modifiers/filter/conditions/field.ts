import type { ConditionFieldNode } from '@directus/data';
import type { IndexGenerators } from '../../../utils/create-index-generators.js';
import { convertTarget } from '../../target.js';
import type { FilterResult } from '../utils.js';

export function convertFieldCondition(
	node: ConditionFieldNode,
	tableIndex: number,
	indexGen: IndexGenerators,
	negate: boolean,
): FilterResult {
	const { value: value1, joins: joins1, parameters: parameters1 } = convertTarget(node.target, tableIndex, indexGen);
	const { value: value2, joins: joins2, parameters: parameters2 } = convertTarget(node.compareTo, tableIndex, indexGen);

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
		parameters: [...parameters1, ...parameters2],
	};
}
