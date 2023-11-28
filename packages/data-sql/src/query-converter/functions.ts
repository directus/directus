import type { AbstractQueryFunction } from '@directus/data';
import type { ParameterTypes, ValuesNode, AbstractSqlQueryFnNode } from '../types/index.js';

/**
 * @param collection
 * @param abstractFunction - the function node to convert
 * @param idxGenerator - the generator to get the next index in the parameter list
 * @param generatedAlias - a generated alias which needs to be specified when to function is used within the select clause
 */
export function convertFn(
	collection: string,
	abstractFunction: AbstractQueryFunction,
	idxGenerator: Generator,
	generatedAlias?: string,
): { fn: AbstractSqlQueryFnNode; parameters: ParameterTypes[] } {
	const fn: AbstractSqlQueryFnNode = {
		type: 'fn',
		fn: abstractFunction.fn,
		table: collection,
		column: abstractFunction.field,
	};

	if (generatedAlias) {
		fn.as = generatedAlias;
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
