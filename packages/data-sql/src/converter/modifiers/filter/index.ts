import type { AbstractQueryFilterNode, AbstractQueryConditionNode } from '@directus/data';
import type { AbstractSqlQuery } from '../../../types/index.js';
import { convertCondition } from './conditions/index.js';
import { convertLogical } from './logical.js';

/**
 * Basically extracts the filter values and replaces it with parameter indexes.
 * It also converts the negation format.
 * This function is called recursively for negation and logical nodes.
 *
 * @todo move to separate file, index file should only export/input...
 *
 * @param filter - all filter conditions
 * @param collection - the name of the collection
 * @param firstParameterIndex - The index of the parameter. Mandatory for all operators.
 * @param secondParameterIndex - The index of an additional parameter. Only needed for some operators like BETWEEN.
 * @returns
 */
export const convertFilter = (
	filter: AbstractQueryFilterNode,
	collection: string,
	generator: Generator<number, never, never>,
	negate = false
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> => {
	if (filter.type === 'condition') {
		return convertCondition(filter as AbstractQueryConditionNode, collection, generator, negate);
	} else if (filter.type === 'negate') {
		return convertFilter(filter.childNode, collection, generator, !negate);
	} else if (filter.type === 'logical') {
		return convertLogical(filter, collection, generator, negate);
	} else {
		throw new Error(`Unknown filter type`);
	}
};
