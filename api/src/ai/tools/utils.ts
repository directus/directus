import type { Accountability, SchemaOverview } from '@directus/types';
import { parseJSON } from '@directus/utils';
import { sanitizeQuery } from '../../utils/sanitize-query.js';

const JSON_COERCE_FIELDS = ['data', 'keys', 'query', 'headers'];

/**
 * LLMs sometimes return object/array arguments as stringified JSON.
 * Coerce known fields back to native values before validation.
 */
export function coerceJsonFields(args: Record<string, unknown>): Record<string, unknown> {
	const coerced = { ...args };

	for (const field of JSON_COERCE_FIELDS) {
		if (typeof coerced[field] === 'string') {
			try {
				coerced[field] = parseJSON(coerced[field] as string);
			} catch {
				// Leave as-is if not valid JSON
			}
		}
	}

	return coerced;
}

/**
 * Build a sanitized query object from a tool's args payload.
 * - Ensures fields defaults to '*' when not provided
 * - Returns an empty object when no args.query is present
 */
export async function buildSanitizedQueryFromArgs<T extends { query?: Record<string, any> | undefined }>(
	args: T,
	schema: SchemaOverview,
	accountability?: Accountability | null,
): Promise<Record<string, any>> {
	let sanitizedQuery: Record<string, any> = {};

	if (args?.query) {
		const q = args.query;

		sanitizedQuery = await sanitizeQuery(
			{
				fields: q['fields'] ?? '*',
				...q,
			},
			schema,
			accountability ?? undefined,
		);
	}

	return sanitizedQuery;
}
