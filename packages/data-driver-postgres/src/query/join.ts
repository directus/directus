import type { AbstractSqlQuery } from '@directus/data-sql';
import { conditionString } from '../utils/condition-string.js';
import { escapeIdentifier } from '../utils/escape-identifier.js';

/**
 * Generates the `SELECT x, y` part of a SQL statement.
 * The fields are always prefixed with the table name.
 */
export const join = ({ join }: AbstractSqlQuery): string | null => {
	if (join === undefined || join.length === 0) return null;

	let joinString = '';

	for (const node of join) {
		joinString += `LEFT JOIN ${escapeIdentifier(node.table)} ${escapeIdentifier(node.as)} ON ${conditionString(
			node.on
		)}`;
	}

	return joinString;
};
