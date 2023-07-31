import type { AbstractQueryNodeLogical } from '@directus/data';
import type { AbstractSqlQuery } from '../../../types/index.js';
import { convertFilter } from './filter.js';

export function convertLogical(
	filter: AbstractQueryNodeLogical,
	collection: string,
	generator: Generator<number, number, number>,
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
