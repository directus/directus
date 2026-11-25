import type { SchemaOverview } from '@directus/types';

/**
 * A filter is considered relational if it follows a path into another collection, or targets an alias field
 */
export function isRelationalFilter(schema: SchemaOverview, collection: string, filterPath: string[]) {
	return filterPath.length > 1 || schema.collections[collection]?.fields[filterPath[0]!]?.type === 'alias';
}
