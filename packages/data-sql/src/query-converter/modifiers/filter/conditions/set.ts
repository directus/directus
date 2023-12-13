import type { ConditionSetNode } from '@directus/data';
import type { IndexGenerators } from '../../../../utils/create-index-generators.js';
import { convertTarget } from '../../target.js';
import type { FilterResult } from '../utils.js';

export function convertSetCondition(
	node: ConditionSetNode,
	tableIndex: number,
	indexGen: IndexGenerators,
	negate: boolean,
): FilterResult {
	const { value, joins } = convertTarget(node.target, tableIndex, indexGen);

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
						parameterIndexes: Array.from(node.compareTo).map(() => indexGen.parameter.next().value),
					},
				},
			},
			joins,
		},
		parameters: [...node.compareTo],
	};
}
