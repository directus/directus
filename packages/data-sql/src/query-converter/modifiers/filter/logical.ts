import type { FilterResult } from './filter.js';

export function convertLogical(children: FilterResult[], operator: 'and' | 'or', negate: boolean): FilterResult {
	const childWhereClauses = children.map((child) => child.clauses.where);
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
