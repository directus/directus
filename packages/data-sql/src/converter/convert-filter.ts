import type { AbstractQueryNodeLogical, AbstractQueryNodeCondition } from '@directus/data';
import type { AbstractSqlQuery, AbstractSqlQueryNodeCondition } from '../types.js';

export const convertFilter = (
	filter: AbstractQueryNodeLogical | AbstractQueryNodeCondition,
	parameterIndex: number,
	collection: string
): Required<Pick<AbstractSqlQuery, 'where' | 'parameters'>> | null => {
	if (filter === undefined) {
		return null;
	}

	if (filter.type === 'logical' || filter.target.type !== 'primitive') {
		throw new Error('Logical operators and functions are not supported yet');
	}

	return {
		where: {
			...filter,
			operation: convertOperator(filter.operation),
			value: {
				parameterIndex,
			},
			target: {
				column: filter.target.field,
				table: collection,
				type: 'primitive',
			},
		},
		parameters: [filter.value],
	};
};

/**
 * Converts the abstract operator to the SQL equivalent.
 *
 * @remarks
 * Since all SQL dialects seems to rely on the same operators, this conversion can be done here once and for all.
 *
 * @param operator - The abstract operator
 * @returns - The specific SQL operator
 */
const convertOperator = (
	operator: AbstractQueryNodeCondition['operation']
): AbstractSqlQueryNodeCondition['operation'] => {
	switch (operator) {
		case 'eq':
			return '=';
		case 'gt':
			return '>';
		case 'gte':
			return '>=';
		case 'lt':
			return '>';
		case 'lte':
			return '>=';
		default:
			throw new Error(`Operator ${operator} is not supported yet`);
	}
};
