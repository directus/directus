import type { AbstractSqlQuery } from '@directus/data-sql';
import { conditionString } from '../utils/conditions/index.js';
import { escapeIdentifier } from '../utils/escape-identifier.js';

/**
 * Generates `LEFT JOIN x ON y` part.
 * @param query the whole abstract query
 * @returns the JOIN part or null if there are no joins in the query
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
