/**
 * This module should be moved outside of src/query because it's not only used for querying, but also for UPDATE or DELETE commands.
 */
import type { AbstractSqlClauses } from '@directus/data-sql';
import { conditionString } from '../utils/conditions/index.js';

/**
 * Creates the WHERE clause for a SQL query.
 *
 * @param - The abstract SQL query.
 * @returns The WHERE clause or null if no WHERE clause is needed.
 */
export const where = ({ where }: AbstractSqlClauses): string | null => {
	if (where === undefined) {
		return null;
	}

	return `WHERE ${conditionString(where)}`;
};
