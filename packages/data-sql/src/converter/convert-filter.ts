import type { AbstractQueryNodeCondition } from '@directus/data';
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
	filter: AbstractQueryNodeCondition,
	collection: string,
	firstParameterIndex: number,
	secondParameterIndex: number | null
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> | null => {
	if (filter === undefined) {
		return null;
	}

	if (filter.target.type !== 'primitive' || filter.compareTo.type !== 'value') {
		throw new Error('Only primitives are currently supported.');
	}

	if (filter.operation === 'intersects' || filter.operation === 'intersects_bounding_box') {
		throw new Error('The intersects operators are not yet supported.');
	}

	const parameterIndexes = [firstParameterIndex];

	if (secondParameterIndex !== null) {
		parameterIndexes.push(secondParameterIndex);
	}

	return {
		where: {
			type: 'condition',
			negation: filter.negation,
			operation: filter.operation,
			target: {
				column: filter.target.field,
				table: collection,
				type: 'primitive',
			},
			compareTo: {
				type: 'value',
				parameterIndexes,
			},
		},
		parameters: filter.compareTo.values,
	};
};
