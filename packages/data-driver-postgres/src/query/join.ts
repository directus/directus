import type { AbstractSqlClauses } from '@directus/data-sql';
import { conditionString } from '../utils/conditions/index.js';
import { escapeIdentifier } from '../utils/escape-identifier.js';
import { tableIndexToIdentifier } from '../utils/index-to-identifier.js';

/**
 * Generates `LEFT JOIN x ON y` part.
 *
 * @param query - The whole abstract SQL query
 * @returns the JOIN part or null if there are no joins in the query
 */
export const join = ({ joins }: AbstractSqlClauses): string | null => {
	if (joins === undefined || joins.length === 0) return null;

	const joinStrings = joins.map((join) => {
		const tableAlias = tableIndexToIdentifier(join.tableIndex);
		const joinCondition = conditionString(join.on);

		return `LEFT JOIN ${escapeIdentifier(join.tableName)} AS ${escapeIdentifier(tableAlias)} ON ${joinCondition}`;
	});

	return joinStrings.join(' ');
};
