import type { AbstractSqlQuery } from '@directus/data-sql';
import { wrapColumn } from '../utils/wrap-column.js';

export const where = ({ where }: AbstractSqlQuery): string | null => {
	if (where === undefined) {
		return null;
	}

	let target = null;

	if (where.type === 'condition') {
		if (where.target.type === 'primitive') {
			target = wrapColumn(where.target.table, where.target.column);
		} else {
			throw new Error('Functions are not yet supported.');
		}
	} else {
		throw new Error('Logical operators are not yet supported.');
	}

	return `WHERE ${target} ${where.operation} $${where.value.parameterIndex + 1}`;
};
