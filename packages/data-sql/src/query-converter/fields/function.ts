import type { AbstractQueryFunction } from '@directus/data';
import type { AbstractSqlQuerySelectFnNode, ParameterTypes } from '../../types/index.js';
import type { IndexGenerators } from '../../utils/create-index-generators.js';
import { convertFn } from '../common/function.js';

/**
 * @param collection
 * @param abstractFunction - the function node to convert
 * @param generatedAlias - a generated alias which needs to be specified when to function is used within the select clause
 * @param indexGen - the generator to get the next index in the parameter list
 */
export function convertFieldFn(
	collection: string,
	abstractFunction: AbstractQueryFunction,
	generatedAlias: string,
	indexGen: IndexGenerators,
): { fn: AbstractSqlQuerySelectFnNode; parameters: ParameterTypes[] } {
	const { fn, parameters } = convertFn(collection, abstractFunction, indexGen);

	return {
		fn: {
			...fn,
			as: generatedAlias,
		},
		parameters,
	};
}
