import { sanitizeQuery } from '@/utils/sanitize-query.js';
import type { Accountability, Query, SchemaOverview } from '@directus/types';

/**
 * Build a sanitized query object from a tool's args payload.
 * - Ensures fields defaults to '*' when not provided
 * - Returns an empty object when no args.query is present
 */
export async function buildSanitizedQueryFromArgs<T extends { query?: Partial<Query> | null | undefined }>(
	args: T,
	schema: SchemaOverview,
	accountability?: Accountability | null,
): Promise<Record<string, any>> {
	let sanitizedQuery: Record<string, any> = {};

	if (args?.query) {
		const q = args.query;

		sanitizedQuery = await sanitizeQuery(
			{
				fields: q.fields ?? '*',
				...q,
			},
			schema,
			accountability ?? undefined,
		);
	}

	return sanitizedQuery;
}

