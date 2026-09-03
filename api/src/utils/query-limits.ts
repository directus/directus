/**
 * Limits bounding how much work parsing a single query is allowed to cause.
 *
 * `filter` is parsed and walked by `sanitizeQuery` before any router runs, so without these the
 * only bound on that work is the size of the request itself.
 */

import { useEnv } from '@directus/env';
import { InvalidQueryError } from '@directus/errors';
import { isPlainObject } from 'lodash-es';

/**
 * Limits for a single query parse. `size` and `nodes` are remaining allowances consumed across the
 * whole parse, including filters nested under `deep`, so nesting cannot be used to multiply the
 * amount of work one request is allowed to cause.
 */
export type QueryLimits = {
	/** Remaining characters of serialized `filter`/`deep` input */
	size: number;
	/** Remaining `filter`/`deep` nodes */
	nodes: number;
	/** Maximum nesting depth of a single filter */
	maxFilterDepth: number;
	/** Maximum nesting depth of `deep` */
	maxDeepDepth: number;
	/** Current `deep` nesting level, saved and restored around recursion */
	deepDepth: number;
};

/** Used when the corresponding env var is unset or unusable. Mirrors `DEFAULTS` in `@directus/env`. */
const LIMIT_FALLBACKS = {
	QUERY_FILTER_MAX_SIZE: 32_768,
	QUERY_FILTER_MAX_NODES: 10_000,
	QUERY_FILTER_MAX_DEPTH: 25,
	QUERY_DEEP_MAX_DEPTH: 20,
} as const;

export function getQueryLimits(): QueryLimits {
	const env = useEnv();

	return {
		size: limitFromEnv(env, 'QUERY_FILTER_MAX_SIZE'),
		nodes: limitFromEnv(env, 'QUERY_FILTER_MAX_NODES'),
		maxFilterDepth: limitFromEnv(env, 'QUERY_FILTER_MAX_DEPTH'),
		maxDeepDepth: limitFromEnv(env, 'QUERY_DEEP_MAX_DEPTH'),
		deepDepth: 0,
	};
}

function limitFromEnv(env: Record<string, unknown>, key: keyof typeof LIMIT_FALLBACKS): number {
	const value = Number(env[key]);

	// `Infinity` is honored as an explicit opt-out; unset or nonsensical values use the fallback
	return Number.isNaN(value) || value <= 0 ? LIMIT_FALLBACKS[key] : value;
}

/** Deducts `input` from the remaining size allowance and rejects once it runs out. */
export function checkSize(input: string, limits: QueryLimits, parameter: string): void {
	limits.size -= input.length;

	if (limits.size < 0) {
		throw new InvalidQueryError({ reason: `"${parameter}" exceeds the maximum allowed size` });
	}
}

/** Deducts a single node from the remaining node allowance and rejects once it runs out. */
export function checkNode(limits: QueryLimits, parameter: string): void {
	if (--limits.nodes < 0) {
		throw new InvalidQueryError({ reason: `"${parameter}" exceeds the maximum allowed number of nodes` });
	}
}

export function checkDepth(depth: number, maxDepth: number, parameter: string): void {
	if (depth > maxDepth) {
		throw new InvalidQueryError({ reason: `"${parameter}" exceeds the maximum allowed nesting depth` });
	}
}

/**
 * Deducts every node of a parsed filter from the remaining node allowance and rejects anything
 * nested deeper than `maxFilterDepth`. Iterative rather than recursive: this runs ahead of the
 * recursive filter parsers, so it has to survive input deeper than the call stack allows.
 */
export function checkFilterNodes(filter: unknown, limits: QueryLimits): void {
	const stack: [unknown, number][] = [[filter, 1]];

	while (stack.length > 0) {
		const [value, depth] = stack.pop()!;

		checkNode(limits, 'filter');

		let children: unknown[];

		if (Array.isArray(value)) {
			children = value;
		} else if (isPlainObject(value)) {
			children = Object.values(value as Record<string, unknown>);
		} else {
			continue;
		}

		checkDepth(depth, limits.maxFilterDepth, 'filter');

		for (const child of children) stack.push([child, depth + 1]);
	}
}
