import type { AbstractQueryFunction } from '@directus/data';
import type { AbstractSqlQueryFnNode, ParameterTypes, ValuesNode } from '../../types/index.js';

/**
 * @param collection
 * @param abstractFunction - the function node to convert
 * @param idxGenerator - the generator to get the next index in the parameter list
 */
export function convertFn(
	collection: string,
	abstractFunction: AbstractQueryFunction,
	idxGenerator: Generator,
): { fn: AbstractSqlQueryFnNode; parameters: ParameterTypes[] } {
	const fn: AbstractSqlQueryFnNode = {
		type: 'fn',
		fn: abstractFunction.fn,
		table: collection,
		column: abstractFunction.field,
	};

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
