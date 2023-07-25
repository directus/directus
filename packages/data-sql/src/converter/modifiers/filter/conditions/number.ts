import type { ConditionNumberNode } from '@directus/data';
import type { AbstractSqlQuery } from '../../../../types/index.js';
import { convertTarget } from './utils.js';

export function convertNumberNode(
	node: ConditionNumberNode,
	collection: string,
	generator: Generator,
	negate: boolean
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> {
	return {
		where: {
			type: 'condition',
			negate,
			condition: {
				type: node.type,
				operation: node.operation,
				target: convertTarget(node, collection, generator),
				compareTo: {
					type: 'value',
					parameterIndex: generator.next().value,
				},
			},
		},
		parameters: [node.compareTo],
	};
}
