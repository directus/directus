import type { ConditionGeoIntersectsBBoxNode, ConditionGeoIntersectsNode } from '@directus/data';
import type { IndexGenerators } from '../../../utils/create-index-generators.js';
import { convertTarget } from '../../target.js';
import type { FilterResult } from '../utils.js';

export function convertGeoCondition(
	node: ConditionGeoIntersectsNode | ConditionGeoIntersectsBBoxNode,
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
					type: 'condition-geo',
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
