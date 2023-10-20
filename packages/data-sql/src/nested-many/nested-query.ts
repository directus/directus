import type {
	AbstractQuery,
	AbstractQueryConditionNode,
	AbstractQueryFieldNodeNestedMany,
	// AbstractQueryNodeLogical,
} from '@directus/data';

export function convertManyNodeToAbstractQuery(
	nestedMany: AbstractQueryFieldNodeNestedMany,
	chunk: Record<string, any>
): AbstractQuery {
	if (nestedMany.meta.type !== 'o2m') {
		throw new Error('Not yet implemented');
	}

	const relationalKeyFields = nestedMany.meta.join.foreign.fields;
	const relationalKeyValues = relationalKeyFields.map((i) => chunk[i]);

	let filter = null;

	if (relationalKeyFields.length === 1) {
		filter = {
			type: 'condition',
			condition: {
				type: typeof relationalKeyValues[0] === 'number' ? 'condition-number' : 'condition-string',
				target: {
					type: 'primitive',
					field: relationalKeyFields[0],
				},
				operation: 'eq',
				compareTo: relationalKeyValues[0],
			},
		} as AbstractQueryConditionNode;
	} else {
		throw new Error('Not yet implemented');
	}

	return {
		store: nestedMany.meta.join.foreign.store,
		collection: nestedMany.meta.join.foreign.collection,
		fields: nestedMany.fields,
		modifiers: { filter },
	};
}
