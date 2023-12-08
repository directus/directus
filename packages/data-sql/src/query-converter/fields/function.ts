import type { AbstractQueryFunction } from '@directus/data';
import type { AbstractSqlQuerySelectFnNode, ParameterTypes } from '../../types/index.js';
import { convertFn } from '../common/function.js';

/**
 * @param collection
 * @param abstractFunction - the function node to convert
 * @param idxGenerator - the generator to get the next index in the parameter list
 * @param generatedAlias - a generated alias which needs to be specified when to function is used within the select clause
 */
export function convertFieldFn(
	collection: string,
	abstractFunction: AbstractQueryFunction,
	idxGenerator: Generator,
	generatedAlias: string,
): { fn: AbstractSqlQuerySelectFnNode; parameters: ParameterTypes[] } {
	const { fn, parameters } = convertFn(collection, abstractFunction, idxGenerator);

	return {
		fn: {
			...fn,
			as: generatedAlias,
		},
		parameters,
	};
}
