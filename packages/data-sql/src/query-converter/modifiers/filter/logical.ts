import type { WhereUnion } from '../../../types/index.js';

export function convertLogical(children: WhereUnion[], operator: 'and' | 'or', negate: boolean): WhereUnion {
	const childNodes = children.map((child) => child.where);
	const parameters = children.flatMap((child) => child.parameters);

	return {
		where: {
			type: 'logical',
			negate,
			operator,
			childNodes,
		},
		parameters,
	};
}
