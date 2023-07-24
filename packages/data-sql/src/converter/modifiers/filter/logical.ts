import type { AbstractQueryNodeLogical } from '@directus/data';
import type { AbstractSqlQuery } from '../../../types.js';
import { convertFilter } from './index.js';

export function convertLogical(
	filter: AbstractQueryNodeLogical,
	collection: string,
	generator: Generator<number, never, never>,
	negate: boolean
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> {
	const children = filter.childNodes.map((childNode) => convertFilter(childNode, collection, generator, false));

	return {
		where: {
			type: 'logical',
			negate,
			operator: filter.operator,
			childNodes: children.map((child) => child.where),
		},
		parameters: children.flatMap((child) => child.parameters),
	};
}
