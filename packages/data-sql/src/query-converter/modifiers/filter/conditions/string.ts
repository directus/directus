import type { ConditionStringNode } from '@directus/data';
import type { IndexGenerators } from '../../../utils/create-index-generators.js';
import { convertTarget } from '../../target.js';
import type { FilterResult } from '../utils.js';

export function convertStringNode(
	node: ConditionStringNode,
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
					type: node.type,
					operation: node.operation,
					target: value,
					compareTo: {
						type: 'value',
						parameterIndex: indexGen.parameter.next().value,
					},
				},
			},
			joins,
		},
		parameters: [...parameters, node.compareTo],
	};
}
