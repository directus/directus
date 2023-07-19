import type { AbstractSqlQueryJoinNode } from '../../types.js';

export const createJoin = (
	currentCollection: string,
	currentFields: string[],
	externalCollection: string,
	externalCollectionAlias: string,
	externalFields: string[]
): AbstractSqlQueryJoinNode => {
	return {
		type: 'join',
		table: externalCollection,
		as: externalCollectionAlias,
		on: {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: currentFields.map((field, index) => {
				const relatedColumn = externalFields[index];

				if (!relatedColumn) {
					throw new Error(`Missing related foreign key join column for current context column "${field}"`);
				}

				return {
					type: 'join-condition',
					target: {
						type: 'primitive',
						table: currentCollection,
						column: field,
					},
					operator: 'eq',
					compareTo: {
						type: 'primitive',
						table: externalCollectionAlias,
						column: relatedColumn,
					},
				};
			}),
		},
	};
};
