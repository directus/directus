import { DEFAULTS, useEnv } from '@directus/env';
import { InvalidQueryError } from '@directus/errors';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
	consumeFilterNodes,
	consumeNode,
	consumeSize,
	getQueryLimits,
	type QueryLimits,
	validateDepth,
} from './query-limits.js';

// `DEFAULTS` is unmocked, so the assertions below double as a drift check against defaults.ts
vi.mock('@directus/env', async (importOriginal) => ({
	...(await importOriginal<typeof import('@directus/env')>()),
	useEnv: vi.fn(),
}));

const { warn } = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock('../logger/index.js', () => ({ useLogger: () => ({ warn }) }));

beforeEach(() => {
	// The state production reads limits from; tests that care about a value override it
	vi.mocked(useEnv).mockReturnValue(DEFAULTS);
	warn.mockClear();
});

/** Limits with everything set generously, so a test only has to state the one it cares about */
function limits(overrides: Partial<QueryLimits> = {}): QueryLimits {
	const size = overrides.size ?? 1000;
	const nodes = overrides.nodes ?? 1000;

	return {
		size,
		nodes,
		maxSize: size,
		maxNodes: nodes,
		maxFilterDepth: 100,
		maxDeepDepth: 100,
		deepDepth: 0,
		...overrides,
	};
}

describe('getQueryLimits', () => {
	test('should read the limits from the environment', () => {
		vi.mocked(useEnv).mockReturnValue({
			QUERY_FILTER_MAX_SIZE: 111,
			QUERY_FILTER_MAX_NODES: 222,
			QUERY_FILTER_MAX_DEPTH: 33,
			QUERY_DEEP_MAX_DEPTH: 44,
		});

		expect(getQueryLimits()).toEqual({
			size: 111,
			nodes: 222,
			maxSize: 111,
			maxNodes: 222,
			maxFilterDepth: 33,
			maxDeepDepth: 44,
			deepDepth: 0,
		});
	});

	test('should use the shipped defaults', () => {
		expect(getQueryLimits()).toEqual({
			size: 32_768,
			nodes: 10_000,
			maxSize: 32_768,
			maxNodes: 10_000,
			maxFilterDepth: 50,
			maxDeepDepth: 20,
			deepDepth: 0,
		});

		expect(warn).not.toHaveBeenCalled();
	});

	test('should fall back silently when the key is absent', () => {
		// Only reachable when the env was never built, so it is not a misconfiguration
		vi.mocked(useEnv).mockReturnValue({});

		expect(getQueryLimits().nodes).toBe(10_000);
		expect(warn).not.toHaveBeenCalled();
	});

	test.each([
		['a non-numeric string', 'not-a-number'],
		['an empty string', ''],
		['zero', 0],
		['a negative number', -1],
		['null', null],
	])('should fall back when the value is %s', (_label, value) => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_NODES: value });

		expect(getQueryLimits().nodes).toBe(10_000);
	});

	// The memo of reported keys is module level and never cleared. No other test configures this
	// key to an unusable value, so the assertion does not depend on ordering.
	test('should warn once for a configured value that is unusable', () => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_SIZE: 'not-a-number' });

		getQueryLimits();
		getQueryLimits();

		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn).toHaveBeenCalledWith('Invalid value for QUERY_FILTER_MAX_SIZE, falling back to 32768.');
	});

	test('should accept a numeric string', () => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_NODES: '500' });

		expect(getQueryLimits().nodes).toBe(500);
	});

	test('should honor `Infinity` as an explicit opt-out', () => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_NODES: Infinity });

		expect(getQueryLimits().nodes).toBe(Infinity);
	});

	test('should start `deep` nesting at zero', () => {
		expect(getQueryLimits().deepDepth).toBe(0);
	});
});

describe('consumeSize', () => {
	test('should deduct the input length from the remaining allowance', () => {
		const current = limits({ size: 10 });

		consumeSize('abc', current, 'filter');

		expect(current.size).toBe(7);
	});

	test('should accept input exactly at the allowance', () => {
		expect(() => consumeSize('abcde', limits({ size: 5 }), 'filter')).not.toThrow();
	});

	test('should reject input one character over the allowance', () => {
		expect(() => consumeSize('abcdef', limits({ size: 5 }), 'filter')).toThrowError(
			'Invalid query. "filter" exceeds the maximum allowed size of',
		);
	});

	test('should accumulate across calls sharing the same limits', () => {
		const current = limits({ size: 5 });

		consumeSize('abc', current, 'filter');

		expect(() => consumeSize('abc', current, 'deep')).toThrowError(
			'Invalid query. "deep" exceeds the maximum allowed size of',
		);
	});

	test('should name the parameter in the error', () => {
		expect(() => consumeSize('abc', limits({ size: 0 }), 'deep')).toThrowError(
			'Invalid query. "deep" exceeds the maximum allowed size of',
		);
	});

	test('should name the configured maximum in the error', () => {
		expect(() => consumeSize('abcdef', limits({ size: 5, maxSize: 5 }), 'filter')).toThrowError(
			'Invalid query. "filter" exceeds the maximum allowed size of 5 characters.',
		);
	});
});

describe('consumeNode', () => {
	test('should deduct a single node from the remaining allowance', () => {
		const current = limits({ nodes: 3 });

		consumeNode(current, 'filter');

		expect(current.nodes).toBe(2);
	});

	test('should accept exactly as many nodes as the allowance', () => {
		const current = limits({ nodes: 2 });

		expect(() => {
			consumeNode(current, 'filter');
			consumeNode(current, 'filter');
		}).not.toThrow();
	});

	test('should reject the node after the allowance runs out', () => {
		const current = limits({ nodes: 1 });

		consumeNode(current, 'filter');

		// Reports the maximum, not what is left
		expect(() => consumeNode(current, 'deep')).toThrowError(
			'Invalid query. "deep" exceeds the maximum allowed node count of 1.',
		);
	});
});

describe('validateDepth', () => {
	test('should accept a depth at the maximum', () => {
		expect(() => validateDepth(5, 5, 'filter')).not.toThrow();
	});

	test('should reject a depth one past the maximum', () => {
		expect(() => validateDepth(6, 5, 'filter')).toThrowError(
			'Invalid query. "filter" exceeds the maximum allowed nesting depth of',
		);
	});

	test('should name the parameter in the error', () => {
		expect(() => validateDepth(6, 5, 'deep')).toThrowError(
			'Invalid query. "deep" exceeds the maximum allowed nesting depth of',
		);
	});
});

describe('consumeFilterNodes', () => {
	test('should count the root, every container and every leaf', () => {
		const current = limits({ nodes: 100 });

		consumeFilterNodes({ field: { _eq: 'x' } }, current);

		expect(current.nodes).toBe(97);
	});

	test('should count array entries', () => {
		const current = limits({ nodes: 100 });

		consumeFilterNodes({ field: { _in: ['a', 'b', 'c'] } }, current);

		expect(current.nodes).toBe(94);
	});

	test('should treat a non-plain object as a single leaf', () => {
		const current = limits({ nodes: 100 });

		consumeFilterNodes({ field: new Date() }, current);

		expect(current.nodes).toBe(98);
	});

	test('should count a primitive filter as one node', () => {
		const current = limits({ nodes: 100 });

		consumeFilterNodes('x', current);

		expect(current.nodes).toBe(99);
	});

	test('should reject once the node allowance runs out', () => {
		expect(() => consumeFilterNodes({ a: 'x', b: 'x', c: 'x' }, limits({ nodes: 3 }))).toThrowError(
			'Invalid query. "filter" exceeds the maximum allowed node count of',
		);
	});

	test('should draw from the allowance left by an earlier call', () => {
		const current = limits({ nodes: 4 });
		const filter = { field: { _eq: 'x' } };

		consumeFilterNodes(filter, current);

		expect(() => consumeFilterNodes(filter, current)).toThrowError(InvalidQueryError);
	});

	test('should accept nesting exactly at the depth limit', () => {
		const filter = { a: { b: { _eq: 'x' } } };

		expect(() => consumeFilterNodes(filter, limits({ maxFilterDepth: 3 }))).not.toThrow();
	});

	test('should reject nesting one level past the depth limit', () => {
		const filter = { a: { b: { _eq: 'x' } } };

		expect(() => consumeFilterNodes(filter, limits({ maxFilterDepth: 2 }))).toThrowError(
			'Invalid query. "filter" exceeds the maximum allowed nesting depth of',
		);
	});

	test('should not count the array wrapping an `_and` group as a level', () => {
		const filter = { _and: [{ field: { _eq: 'x' } }] };

		expect(() => consumeFilterNodes(filter, limits({ maxFilterDepth: 3 }))).not.toThrow();
		expect(() => consumeFilterNodes(filter, limits({ maxFilterDepth: 2 }))).toThrowError(InvalidQueryError);
	});

	test('should charge the same depth however a filter is grouped', () => {
		const ungrouped = { a: { b: { _eq: 'x' } } };
		const grouped = { _and: [{ a: { _and: [{ b: { _and: [{ _eq: 'x' }] } }] } }] };

		expect(() => consumeFilterNodes(ungrouped, limits({ maxFilterDepth: 3 }))).not.toThrow();
		expect(() => consumeFilterNodes(grouped, limits({ maxFilterDepth: 6 }))).not.toThrow();
	});

	// The shape the app's filter builder emits. Counting the group's array as a level takes this
	// to 33 rather than 22, rejecting a filter within `MAX_RELATIONAL_DEPTH`'s default of 10.
	test('should charge a fully grouped filter 2 levels per relation', () => {
		let filter: Record<string, any> = { _and: [{ _eq: 'x' }] };

		for (let level = 0; level < 10; level++) {
			filter = { _and: [{ [`rel_${level}`]: filter }] };
		}

		expect(() => consumeFilterNodes(filter, limits({ maxFilterDepth: 22 }))).not.toThrow();
		expect(() => consumeFilterNodes(filter, limits({ maxFilterDepth: 21 }))).toThrowError(InvalidQueryError);
	});

	test('should reject input deeper than the call stack without overflowing', () => {
		let filter: Record<string, any> = { _eq: 'x' };

		for (let level = 0; level < 100_000; level++) {
			filter = { a: filter };
		}

		// Iterative, so this rejects rather than overflowing
		expect(() => consumeFilterNodes(filter, limits({ nodes: Infinity, maxFilterDepth: 25 }))).toThrowError(
			InvalidQueryError,
		);
	});
});
