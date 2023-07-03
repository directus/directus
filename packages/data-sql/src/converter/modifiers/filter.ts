import type { AbstractQueryFilterNode } from '@directus/data';
import type { AbstractSqlQuery } from '../types.js';

/**
 * Extracts the filer values and replaces it with parameter indexes.
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

const convertFilterWithNegate = (
	filter: AbstractQueryFilterNode,
	collection: string,
	generator: Generator<number, never, never>,
	negate: boolean
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> => {
	if (filter.type === 'condition') {
		if (filter.target.type !== 'primitive') {
			/** @todo */
			throw new Error('Only primitives are currently supported.');
		}

		if (filter.operation === 'intersects' || filter.operation === 'intersects_bounding_box') {
			/** @todo */
			throw new Error('The intersects operators are not yet supported.');
		}

		/** @todo support AbstractSqlQueryColumn as compareTo value */

		return {
			where: {
				type: 'condition',
				negate,
				operation: filter.operation,
				target: {
					column: filter.target.field,
					table: collection,
					type: 'primitive',
				},
				compareTo: {
					type: 'value',
					parameterIndexes: [generator.next().value],
				},
			},
			parameters: [filter.compareTo.value],
		};
	} else if (filter.type === 'negate') {
		return convertFilterWithNegate(filter.childNode, collection, generator, !negate);
	} else {
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
};
