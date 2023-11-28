import type { AbstractQueryConditionNode, AbstractQueryFilterNode, AtLeastOneElement } from '@directus/data';
import { convertCondition } from './conditions/conditions.js';
import { convertLogical } from './logical.js';
import type { FilterResult } from './utils.js';

/**
 * Extracts the user provided filter values and puts them in the list of parameters.
 * It also converts the negation format.
 * This function is recursive.
 *
 * @param filter - the filter to apply
 * @param collection - the name of the collection
 * @param generator - the generator for the parameter index
 * @param negate - whether the filter should be negated
 * @returns
 */
export const convertFilter = (
	filter: AbstractQueryFilterNode,
	collection: string,
	generator: Generator<number, number, number>,
	negate = false,
): FilterResult => {
	if (filter.type === 'condition') {
		return convertCondition(filter as AbstractQueryConditionNode, collection, generator, negate);
	} else if (filter.type === 'negate') {
		return convertFilter(filter.childNode, collection, generator, !negate);
	} else if (filter.type === 'logical') {
		const children = filter.childNodes.map((childNode) =>
			convertFilter(childNode, collection, generator, false),
		) as AtLeastOneElement<FilterResult>;

		return convertLogical(children, filter.operator, negate);
	} else {
		throw new Error(`Unknown filter type`);
	}
};
