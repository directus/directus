import type { AbstractQueryFunction } from '@directus/data';
import type { AbstractSqlQueryFnNode, ParameterTypes, ValuesNode } from '../../types/index.js';
import type { IndexGenerators } from '../../utils/create-index-generators.js';

/**
 * @param tableIndex
 * @param abstractFunction - the function node to convert
 * @param indexGen - the generator to get the next index in the parameter list
 */
export function convertFn(
	tableIndex: number,
	abstractFunction: AbstractQueryFunction,
	indexGen: IndexGenerators,
): { fn: AbstractSqlQueryFnNode; parameters: ParameterTypes[] } {
	const fn: AbstractSqlQueryFnNode = {
		type: 'fn',
		fn: abstractFunction.fn,
		tableIndex,
		columnName: abstractFunction.field,
	};

	if (abstractFunction.args && abstractFunction.args?.length > 0) {
		fn.arguments = {
			type: 'values',
			parameterIndexes: abstractFunction.args.map(() => indexGen.parameter.next().value),
		} as ValuesNode;
	}

	return {
		fn,
		parameters: abstractFunction.args ?? [],
	};
}
