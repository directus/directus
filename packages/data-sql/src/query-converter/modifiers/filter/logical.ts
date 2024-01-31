import type { AtLeastOneElement } from '@directus/data';
import type { AbstractSqlQueryWhereNode } from '../../../types/index.js';
import type { FilterResult } from './utils.js';

export function convertLogical(
	children: AtLeastOneElement<FilterResult>,
	operator: 'and' | 'or',
	negate: boolean,
): FilterResult {
	const childWhereClauses = children.map(
		(child) => child.clauses.where,
	) as AtLeastOneElement<AbstractSqlQueryWhereNode>;

	const parameters = children.flatMap((child) => child.parameters);
	const joins = children.flatMap((child) => child.clauses.joins);

	return {
		clauses: {
			where: {
				type: 'logical',
				negate,
				operator,
				childNodes: childWhereClauses,
			},
			joins,
		},
		parameters,
	};
}
