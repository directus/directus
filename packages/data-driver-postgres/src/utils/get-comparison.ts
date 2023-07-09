import type { CompareToNodeTypes } from '@directus/data-sql';
import { wrapColumn } from './wrap-column.js';
import { constructSqlQuery } from '../query/index.js';

/**
 * Converts the abstract operators to SQL operators and adds the value to which should be compared.
 * Depending on how the other SQL drivers look like regarding this, this function may be moved to @directus/data-sql.
 *
 * @param operation - The abstract operator.
 * @param providedIndexes - The indexes of all parameters.
 * @returns An operator with a parameter reference to a value to which the target will be compared.
 */
export function getComparison(operation: string, compareTo: CompareToNodeTypes, negate = false) {
	let value: string;

	if (compareTo.type === 'value') {
		const parameterIndex = compareTo.parameterIndexes[0]! + 1;
		value = `$${parameterIndex}`;
	} else if (compareTo.type === 'primitive') {
		value = wrapColumn(compareTo.table, compareTo.column);
	} else if (compareTo.type === 'query') {
		const subQuery = constructSqlQuery(compareTo);
		value = subQuery.statement;
	} else {
		throw new Error(`Unsupported compareTo value`);
	}

	switch (operation) {
		case 'eq':
			return `${negate ? '!=' : '='} ${value}`;
		case 'gt':
			return `${negate ? '<=' : '>'} ${value}`;
		case 'gte':
			return `${negate ? '<' : '>='} ${value}`;
		case 'lt':
			return `${negate ? '>=' : '<'} ${value}`;
		case 'lte':
			return `${negate ? '>' : '<='} ${value}`;
		case 'contains':
			return `${negate ? 'NOT LIKE' : 'LIKE'} '%${value}%'`;
		case 'starts_with':
			return `${negate ? 'NOT LIKE' : 'LIKE'} '${value}%'`;
		case 'ends_with':
			return `${negate ? 'NOT LIKE' : 'LIKE'} '%${value}'`;
		case 'in':
			return `IN (${value})`;
		default:
			throw new Error(`Unsupported operation: ${operation}`);
	}
}
