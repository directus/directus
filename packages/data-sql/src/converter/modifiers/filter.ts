import type { AbstractQueryFilterNode, AbstractQueryNodeCondition, AbstractQueryNodeLogical } from '@directus/data';
import type { AbstractSqlQuery } from '../../types.js';
import type { AbstractSqlQueryFnNode, AbstractSqlQuerySelectNode } from '../../types.js';
import { convertFn } from '../functions.js';

/**
 * Basically extracts the filter values and replaces it with parameter indexes.
 * It also converts the negation format.
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
	generator: Generator<number, never, never>
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> => {
	return convertFilterWithNegate(filter, collection, generator, false);
};

/**
 * This function is called recursively for negation and logical nodes.
 *
 * @param filter the various filter node
 * @param collection name of the collection
 * @param generator to generate parameter indexes
 * @param negate
 * @returns the where part part and the parameters used for this part
 */
const convertFilterWithNegate = (
	filter: AbstractQueryFilterNode,
	collection: string,
	generator: Generator<number, never, never>,
	negate: boolean
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> => {
	switch (filter.type) {
		case 'condition':
			return convertCondition(filter, collection, generator, negate);
		case 'negate':
			return convertFilterWithNegate(filter.childNode, collection, generator, !negate);
		case 'logical':
			return convertLogical(filter, collection, generator, negate);
		default:
			throw new Error(`Unknown filter type`);
	}
};

function convertCondition(
	filter: AbstractQueryNodeCondition,
	collection: string,
	generator: Generator<number, never, never>,
	negate: boolean
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> {
	if (filter.operation === 'intersects' || filter.operation === 'intersects_bounding_box') {
		/** @todo */
		throw new Error('The intersects operators are not yet supported.');
	}

	let target: AbstractSqlQueryFnNode | AbstractSqlQuerySelectNode;
	const parameters = [];

	if (filter.target.type === 'primitive') {
		target = {
			type: 'primitive',
			table: collection,
			column: filter.target.field,
		};
	} else if (filter.target.type === 'fn') {
		const convertedFn = convertFn(collection, filter.target, generator);
		target = convertedFn.fn;
		parameters.push(...convertedFn.parameters);
	} else {
		throw new Error('The related field types are not yet supported.');
	}

	return {
		where: {
			type: 'condition',
			negate,
			operation: filter.operation,
			target,
			compareTo: {
				type: 'value',
				parameterIndexes: [generator.next().value],
			},
		},
		parameters: [...parameters, filter.compareTo.value],
	};
}

function convertLogical(
	filter: AbstractQueryNodeLogical,
	collection: string,
	generator: Generator<number, never, never>,
	negate: boolean
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> {
	const children = filter.childNodes.map((childNode) =>
		convertFilterWithNegate(childNode, collection, generator, false)
	);

	return {
		where: {
			type: 'logical',
			negate,
			operator: filter.operator,
			childNodes: children.map((child) => child.where),
		},
		parameters: children.flatMap((child) => child.parameters),
	};
}
