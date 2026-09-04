/**
 * `filter` is parsed and walked by `sanitizeQuery` before any checks run, so without these limits
 * the only bound on that work is the size of the request. Size and nodes are allowances spent
 * across the whole parse, including filters nested under `deep`, so nesting cannot multiply them.
 */

import { DEFAULTS, useEnv } from '@directus/env';
import { InvalidQueryError } from '@directus/errors';
import { isPlainObject } from 'lodash-es';
import { useLogger } from '../logger/index.js';

export type QueryMaximums = {
	maxSize: number;
	maxNodes: number;
	maxFilterDepth: number;
	maxDeepDepth: number;
};

type LimitKey = 'QUERY_FILTER_MAX_SIZE' | 'QUERY_FILTER_MAX_NODES' | 'QUERY_FILTER_MAX_DEPTH' | 'QUERY_DEEP_MAX_DEPTH';

const warned = new Set<LimitKey>();

/**
 * The allowances a single query parse may spend, and the cursor tracking how deep into `deep` it
 * currently is. One instance spans a whole parse: it is handed to `sanitizeQuery`, survives the
 * round trip a nested `_deep` makes back through it, and covers an entire GraphQL selection set.
 *
 * Pass the instance itself; a `{...limits}` copy would lose these methods.
 */
export class QueryLimits {
	/** Only string input is charged; already-parsed input is bounded by nodes and `MAX_PAYLOAD_SIZE` */
	private size: number;
	private nodes: number;
	private deepDepth = 0;

	/** Retained so a rejection can name the limit it hit */
	readonly maxSize: number;
	readonly maxNodes: number;
	readonly maxFilterDepth: number;
	readonly maxDeepDepth: number;

	constructor(maximums: QueryMaximums) {
		this.maxSize = maximums.maxSize;
		this.maxNodes = maximums.maxNodes;
		this.maxFilterDepth = maximums.maxFilterDepth;
		this.maxDeepDepth = maximums.maxDeepDepth;

		this.size = maximums.maxSize;
		this.nodes = maximums.maxNodes;
	}

	/** What is left of each allowance. The parse only spends; nothing branches on the remainder. */
	get remainingSize(): number {
		return this.size;
	}

	get remainingNodes(): number {
		return this.nodes;
	}

	chargeSize(input: string, parameter: string): void {
		this.size -= input.length;

		if (this.size < 0) {
			throw new InvalidQueryError({
				reason: `"${parameter}" exceeds the maximum allowed size of ${this.maxSize} characters`,
			});
		}
	}

	chargeNode(parameter: string): void {
		this.nodes -= 1;

		if (this.nodes < 0) {
			throw new InvalidQueryError({
				reason: `"${parameter}" exceeds the maximum allowed node count of ${this.maxNodes}`,
			});
		}
	}

	/**
	 * Descend one level into `deep` for the duration of `run`, rejecting the level itself if it is
	 * past the limit. The cursor is restored on the way out, since this instance outlives the call.
	 */
	async withDeepLevel<T>(run: () => Promise<T>): Promise<T> {
		this.deepDepth++;

		try {
			this.checkDepth(this.deepDepth, this.maxDeepDepth, 'deep');

			return await run();
		} finally {
			this.deepDepth--;
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
	chargeFilterNodes(filter: unknown, onLeaf?: (value: unknown) => void): void {
		const stack: [unknown, number][] = [[filter, 1]];
		let first = true;

		while (stack.length > 0) {
			const [value, depth] = stack.pop()!;
			const isRoot = first;
			first = false;

			this.chargeNode('filter');

			let children: unknown[];

			if (Array.isArray(value)) {
				children = value;
			} else if (isPlainObject(value)) {
				children = Object.values(value as Record<string, unknown>);
			} else {
				if (onLeaf && !isRoot) onLeaf(value);
				continue;
			}

			this.checkDepth(depth, this.maxFilterDepth, 'filter');

			// The array `_and`/`_or` wrap their operands in is a container, not a level of its own —
			// counting it would make depth depend on how a filter is grouped
			const childDepth = Array.isArray(value) ? depth : depth + 1;

			for (const child of children) stack.push([child, childDepth]);
		}
	}

	private checkDepth(depth: number, maxDepth: number, parameter: string): void {
		if (depth > maxDepth) {
			throw new InvalidQueryError({
				reason: `"${parameter}" exceeds the maximum allowed nesting depth of ${maxDepth}`,
			});
		}
	}
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

export function getQueryLimits(): QueryLimits {
	return new QueryLimits({
		maxSize: limitFromEnv('QUERY_FILTER_MAX_SIZE'),
		maxNodes: limitFromEnv('QUERY_FILTER_MAX_NODES'),
		maxFilterDepth: limitFromEnv('QUERY_FILTER_MAX_DEPTH'),
		maxDeepDepth: limitFromEnv('QUERY_DEEP_MAX_DEPTH'),
	});
}
