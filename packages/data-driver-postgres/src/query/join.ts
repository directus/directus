import type { AbstractSqlClauses } from '@directus/data-sql';
import { conditionString } from '../utils/conditions/index.js';
import { escapeIdentifier } from '../utils/escape-identifier.js';

/**
 * Generates `LEFT JOIN x ON y` part.
 * @param query the whole abstract query
 * @returns the JOIN part or null if there are no joins in the query
 */
export const join = ({ joins }: AbstractSqlClauses): string | null => {
	if (joins === undefined || joins.length === 0) return null;

	let joinString = '';

	for (const join of joins) {
		const tableName = escapeIdentifier(join.table);
		const alias = escapeIdentifier(join.as);
		const joinCondition = conditionString(join.on);
		joinString += `LEFT JOIN ${tableName} ${alias} ON ${joinCondition}`;
	}

	return joinString;
};
