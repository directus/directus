import type { AbstractQueryFieldNodeFn } from '@directus/data';
import type { ParameterTypes, ValuesNode, AbstractSqlQueryFnNode } from '../../types/index.js';

/**
 * @param collection
 * @param abstractFunction
 * @param idxGenerator
 */
export function convertFn(
	collection: string,
	abstractFunction: AbstractQueryFieldNodeFn,
	idxGenerator: Generator,
	as?: string
): { fn: AbstractSqlQueryFnNode; parameters: ParameterTypes[] } {
	if (abstractFunction.targetNode.type !== 'primitive') {
		throw new Error('Nested functions are not yet supported.');
	}

	const fn: AbstractSqlQueryFnNode = {
		type: 'fn',
		fn: abstractFunction.fn,
		field: {
			type: 'primitive',
			table: collection,
			column: abstractFunction.targetNode.field,
		},
	};

	if (abstractFunction.alias) {
		fn.alias = abstractFunction.alias;
	}

	if (as) {
		fn.as = as;
	}

	if (abstractFunction.args && abstractFunction.args?.length > 0) {
		fn.arguments = {
			type: 'values',
			parameterIndexes: abstractFunction.args.map(() => idxGenerator.next().value),
		} as ValuesNode;
	}

	return {
		fn,
		parameters: abstractFunction.args ?? [],
	};
}
