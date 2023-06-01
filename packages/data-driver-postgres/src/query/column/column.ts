import type { AbstractQueryFieldNodePrimitive } from '@directus/data/types';
import { escapeIdentifier } from '../../utils.js';

/**
 * Gets a primitive field value.
 * @param primitive
 * @param table
 * @returns the selection for the primitive field
 */
export function column(primitive: AbstractQueryFieldNodePrimitive, table: string): string {
	return `${escapeIdentifier(table)}.${escapeIdentifier(primitive.field)}`;
}
