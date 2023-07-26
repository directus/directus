/**
 * @todo
 * Move this module outside of src/query because it's not only used for query, but also for modifications like update and delete.
 */
import type { AbstractSqlQuery } from '@directus/data-sql';
import { conditionString } from '../utils/conditions/index.js';

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

	return `WHERE ${conditionString(where)}`;
};
