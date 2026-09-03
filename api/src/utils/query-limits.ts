/**
 * Limits bounding how much work parsing a single query is allowed to cause.
 *
 * `filter` is parsed and walked by `sanitizeQuery` before any router runs, so without these the
 * only bound on that work is the size of the request itself.
 */

import { DEFAULTS, useEnv } from '@directus/env';
import { InvalidQueryError } from '@directus/errors';
import { isPlainObject } from 'lodash-es';
import { useLogger } from '../logger/index.js';

/**
 * Limits for a single query parse. `size` and `nodes` are allowances spent across the whole parse,
 * including filters nested under `deep`, so nesting cannot be used to multiply the amount of work
 * one request is allowed to cause.
 */
export type QueryLimits = {
	/**
	 * Remaining characters of serialized `filter`/`deep` input. Only string input is charged against
	 * this: `filter[a][_eq]=1` and a JSON request body arrive already parsed, and are bounded by
	 * `nodes` and `MAX_PAYLOAD_SIZE` instead.
	 */
	size: number;
	/** Remaining `filter`/`deep` nodes */
	nodes: number;
	/** Configured maxima, retained so a rejection can name the limit it hit */
	maxSize: number;
	maxNodes: number;
	maxFilterDepth: number;
	maxDeepDepth: number;
	/**
	 * Current `deep` nesting level. This is cursor state rather than a limit, and it lives here
	 * because it has to survive the `sanitizeDeep` → `sanitizeQuery` → `sanitizeDeep` round trip a
	 * nested `_deep` makes, and `sanitizeQuery`'s signature only carries the limits.
	 */
	deepDepth: number;
};

type LimitKey = 'QUERY_FILTER_MAX_SIZE' | 'QUERY_FILTER_MAX_NODES' | 'QUERY_FILTER_MAX_DEPTH' | 'QUERY_DEEP_MAX_DEPTH';

/** Keys already reported as unusable, so a bad value is not logged on every request */
const warned = new Set<LimitKey>();

export function getQueryLimits(): QueryLimits {
	const size = limitFromEnv('QUERY_FILTER_MAX_SIZE');
	const nodes = limitFromEnv('QUERY_FILTER_MAX_NODES');

	return {
		size,
		nodes,
		maxSize: size,
		maxNodes: nodes,
		maxFilterDepth: limitFromEnv('QUERY_FILTER_MAX_DEPTH'),
		maxDeepDepth: limitFromEnv('QUERY_DEEP_MAX_DEPTH'),
		deepDepth: 0,
	};
}

function limitFromEnv(key: LimitKey): number {
	const value = Number(useEnv()[key]);

	// `Infinity` is honored as an explicit opt-out
	if (Number.isNaN(value) === false && value > 0) {
		return value;
	}

	// `useEnv` already merges `DEFAULTS`, so this only happens when the configured value is
	// unusable. Falling back silently would leave the operator with a limit they did not choose.
	if (warned.has(key) === false) {
		warned.add(key);
		useLogger().warn(`Invalid value for ${key}, falling back to ${DEFAULTS[key]}.`);
	}

	return Number(DEFAULTS[key]);
}

export function consumeSize(input: string, limits: QueryLimits, parameter: string): void {
	limits.size -= input.length;

	if (limits.size < 0) {
		throw new InvalidQueryError({
			reason: `"${parameter}" exceeds the maximum allowed size of ${limits.maxSize} characters`,
		});
	}
}

export function consumeNode(limits: QueryLimits, parameter: string): void {
	if (--limits.nodes < 0) {
		throw new InvalidQueryError({
			reason: `"${parameter}" exceeds the maximum allowed node count of ${limits.maxNodes}`,
		});
	}
}

export function validateDepth(depth: number, maxDepth: number, parameter: string): void {
	if (depth > maxDepth) {
		throw new InvalidQueryError({
			reason: `"${parameter}" exceeds the maximum allowed nesting depth of ${maxDepth}`,
		});
	}
}

/**
 * Spends the node allowance on every node of a parsed filter and rejects anything nested deeper
 * than `maxFilterDepth`. Iterative rather than recursive: this runs ahead of the recursive filter
 * parsers, so it has to survive input deeper than the call stack allows.
 */
export function consumeFilterNodes(filter: unknown, limits: QueryLimits): void {
	const stack: [unknown, number][] = [[filter, 1]];

	while (stack.length > 0) {
		const [value, depth] = stack.pop()!;

		consumeNode(limits, 'filter');

		let children: unknown[];

		if (Array.isArray(value)) {
			children = value;
		} else if (isPlainObject(value)) {
			children = Object.values(value as Record<string, unknown>);
		} else {
			continue;
		}

		validateDepth(depth, limits.maxFilterDepth, 'filter');

		// The array that `_and`/`_or` wrap their operands in is a container, not a nesting level of
		// its own. Counting it makes the depth of a filter depend on how it is grouped rather than
		// how deeply it is nested.
		const childDepth = Array.isArray(value) ? depth : depth + 1;

		for (const child of children) stack.push([child, childDepth]);
	}
}
