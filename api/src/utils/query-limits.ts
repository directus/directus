/**
 * `filter` is parsed and walked by `sanitizeQuery` before any checks run, so without these limits
 * the only bound on that work is the size of the request. `size` and `nodes` are allowances spent
 * across the whole parse, including filters nested under `deep`, so nesting cannot multiply them.
 */

import { DEFAULTS, useEnv } from '@directus/env';
import { InvalidQueryError } from '@directus/errors';
import { isPlainObject } from 'lodash-es';
import { useLogger } from '../logger/index.js';

export type QueryLimits = {
	/** Only string input is charged; already-parsed input is bounded by `nodes` and `MAX_PAYLOAD_SIZE` */
	size: number;
	nodes: number;
	/** Retained so a rejection can name the limit it hit */
	maxSize: number;
	maxNodes: number;
	maxFilterDepth: number;
	maxDeepDepth: number;
	/** Cursor state, here because it has to survive the `sanitizeQuery` round trip a nested `_deep` makes */
	deepDepth: number;
};

type LimitKey = 'QUERY_FILTER_MAX_SIZE' | 'QUERY_FILTER_MAX_NODES' | 'QUERY_FILTER_MAX_DEPTH' | 'QUERY_DEEP_MAX_DEPTH';

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
	const configured = useEnv()[key];
	const value = Number(configured);

	// `Infinity` is honored as an explicit opt-out
	if (Number.isNaN(value) === false && value > 0) {
		return value;
	}

	// `useEnv` merges `DEFAULTS`, so an absent key means the env was never built, as in tests. Only
	// a value someone actually set is worth warning about, and only once.
	if (configured !== undefined && warned.has(key) === false) {
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
 * Iterative rather than recursive: this runs ahead of the recursive filter parsers, so it has to
 * survive input deeper than the call stack allows.
 *
 * `onLeaf` is called for every value that is not walked into, so a caller that would otherwise
 * traverse the filter again can piggyback on this pass. It is not called for the filter itself,
 * which is not a value within the filter.
 */
export function consumeFilterNodes(filter: unknown, limits: QueryLimits, onLeaf?: (value: unknown) => void): void {
	const stack: [unknown, number][] = [[filter, 1]];
	let first = true;

	while (stack.length > 0) {
		const [value, depth] = stack.pop()!;
		const isRoot = first;
		first = false;

		consumeNode(limits, 'filter');

		let children: unknown[];

		if (Array.isArray(value)) {
			children = value;
		} else if (isPlainObject(value)) {
			children = Object.values(value as Record<string, unknown>);
		} else {
			if (onLeaf && !isRoot) onLeaf(value);
			continue;
		}

		validateDepth(depth, limits.maxFilterDepth, 'filter');

		// The array `_and`/`_or` wrap their operands in is a container, not a level of its own —
		// counting it would make depth depend on how a filter is grouped
		const childDepth = Array.isArray(value) ? depth : depth + 1;

		for (const child of children) stack.push([child, childDepth]);
	}
}
