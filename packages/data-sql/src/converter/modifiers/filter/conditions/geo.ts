import type { ConditionGeoIntersectsNode, ConditionGeoIntersectsBBoxNode } from '@directus/data';
import type { AbstractSqlQuery } from '../../../../types.js';
import { convertPrimitive } from './utils.js';

export function convertGeoCondition(
	node: ConditionGeoIntersectsNode | ConditionGeoIntersectsBBoxNode,
	collection: string,
	generator: Generator,
	negate: boolean
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> {
	return {
		where: {
			type: 'condition',
			negate,
			condition: {
				type: 'condition-geo',
				operation: node.operation,
				target: convertPrimitive(collection, node.target),
				compareTo: {
					type: 'value',
					parameterIndex: generator.next().value,
				},
			},
		},
		parameters: [node.compareTo],
	};
}
