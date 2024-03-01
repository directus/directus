import type { ConditionSetNumberNode } from '@directus/data';
import type { IndexGenerators } from '../../../utils/create-index-generators.js';
import { convertTarget } from '../../target.js';
import type { FilterResult } from '../utils.js';

export function convertSetNumberCondition(
	node: ConditionSetNumberNode,
	tableIndex: number,
	indexGen: IndexGenerators,
	negate: boolean,
): FilterResult {
	const { value, joins, parameters } = convertTarget(node.target, tableIndex, indexGen);

	return {
		clauses: {
			where: {
				type: 'condition',
				negate,
				condition: {
					type: 'condition-set-number',
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
		parameters: [...parameters, ...node.compareTo],
	};
}
