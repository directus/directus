import type { AbstractSqlQuery } from '@directus/data-sql';
import { wrapColumn } from '../utils/wrap-column.js';

export const where = ({ where }: AbstractSqlQuery): string | null => {
	if (where === undefined) {
		return null;
	}

	if (where.type !== 'condition' || where.target.type !== 'primitive') {
		throw new Error('Logical operators and functions are not yet supported in where clause.');
	}

	const target = wrapColumn(where.target.table, where.target.column);

	return `WHERE ${target} ${where.operation} $${where.value.parameterIndex + 1}`;
};
