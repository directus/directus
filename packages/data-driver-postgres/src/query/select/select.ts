import { column } from '../column/column.js';
import type { AbstractQueryFieldNodePrimitive } from '@directus/data/types';
import { escapeIdentifier } from '../../utils.js';

/**
 * Generates the `SELECT x, y` part of a SQL statement.
 * The fields are always prefixed with the table name.
 * @param primitiveFields - the attributes of the collection that should be returned
 * @param table - the collection which should be queried
 * @returns the SELECT clause based on the provided fields
 */
export function select(primitiveFields: AbstractQueryFieldNodePrimitive[], table: string): string {
	if (primitiveFields.length === 0) {
		return `SELECT ${escapeIdentifier(table)}.*`;
	}

	const columns = primitiveFields.map((primitive) => column(primitive, table));

	return `SELECT ${columns.join(', ')}`;
}
