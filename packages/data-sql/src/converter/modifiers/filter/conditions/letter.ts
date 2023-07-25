import type { ConditionLetterNode } from '@directus/data';
import type { AbstractSqlQuery } from '../../../../types.js';
import { convertPrimitive } from './utils.js';

export function convertLetterNode(
	node: ConditionLetterNode,
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
