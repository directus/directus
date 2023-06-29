/**
 * @todo
 * Move this module outside of src/query because it's not only used for query, but also for modifications like update and delete.
 */
import type { AbstractSqlQuery, CompareSetNode, CompareValueNode } from '@directus/data-sql';
import { wrapColumn } from '../utils/wrap-column.js';

/**
 * Creates the WHERE clause for a SQL query.
 *
 * @param - The abstract SQL query.
 * @returns The WHERE clause or null if no WHERE clause is needed.
 */
export const where = ({ where }: AbstractSqlQuery): string | null => {
	if (where === undefined) {
		return null;
	}

	// Support for multiple conditions (type === 'logical') will be added soon
	if (where.type !== 'condition' || where.target.type !== 'primitive' || where.compareTo.type !== 'value') {
		throw new Error('The provided where node is not yet supported.');
	}

	const target = wrapColumn(where.target.table, where.target.column);

	const comparison = getComparison(where.operation, where.compareTo);
	const condition = `${target} ${comparison}`;
	return where.negation ? `WHERE NOT ${condition}` : `WHERE ${condition}`;
};

/**
 * Converts the abstract operators to SQL operators and adds the value to which should be compared.
 * Depending on how the other SQL drivers look like regarding this, this function may be moved to @directus/data-sql.
 *
 * @param operation - The abstract operator.
 * @param providedIndexes - The indexes of all parameters.
 * @returns An operator with a parameter reference to a value to which the target will be compared.
 */
export function getComparison(operation: string, compareTo: CompareValueNode | CompareSetNode) {
	if (compareTo.type !== 'value') {
		throw new Error('Comparisons to sets, f.e. with the IN operator, are not yet supported.');
	}

	const parameterIndex = compareTo.parameterIndexes[0]! + 1;

	switch (operation) {
		case 'eq':
			return `= $${parameterIndex}`;
		case 'gt':
			return `> $${parameterIndex}`;
		case 'gte':
			return `>= $${parameterIndex}`;
		case 'lt':
			return `< $${parameterIndex}`;
		case 'lte':
			return `<= $${parameterIndex}`;
		case 'contains':
			return `LIKE '%$${parameterIndex}%'`;
		case 'starts_with':
			return `LIKE '$${parameterIndex}%'`;
		case 'ends_with':
			return `LIKE '%$${parameterIndex}'`;
		case 'in':
			return `IN (${compareTo.parameterIndexes.map((i) => `$${i + 1}`).join(', ')})`;
		default:
			throw new Error(`Unsupported operation: ${operation}`);
	}
}
