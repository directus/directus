import { useEnv } from '@directus/env';
import { InvalidQueryError } from '@directus/errors';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
	checkDepth,
	checkFilterNodes,
	checkNode,
	checkSize,
	getQueryLimits,
	type QueryLimits,
} from './query-limits.js';

vi.mock('@directus/env', () => ({ useEnv: vi.fn().mockReturnValue({}) }));

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({});
});

/** Limits with everything set generously, so a test only has to state the one it cares about */
function limits(overrides: Partial<QueryLimits> = {}): QueryLimits {
	return { size: 1000, nodes: 1000, maxFilterDepth: 100, maxDeepDepth: 100, deepDepth: 0, ...overrides };
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
			maxFilterDepth: 33,
			maxDeepDepth: 44,
			deepDepth: 0,
		});
	});

	test('should fall back to the shipped defaults when unset', () => {
		expect(getQueryLimits()).toEqual({
			size: 32_768,
			nodes: 10_000,
			maxFilterDepth: 50,
			maxDeepDepth: 20,
			deepDepth: 0,
		});
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

describe('checkSize', () => {
	test('should deduct the input length from the remaining allowance', () => {
		const current = limits({ size: 10 });

		checkSize('abc', current, 'filter');

		expect(current.size).toBe(7);
	});

	test('should accept input exactly at the allowance', () => {
		expect(() => checkSize('abcde', limits({ size: 5 }), 'filter')).not.toThrow();
	});

	test('should reject input one character over the allowance', () => {
		expect(() => checkSize('abcdef', limits({ size: 5 }), 'filter')).toThrowError(
			'Invalid query. "filter" exceeds the maximum allowed size.',
		);
	});

	test('should accumulate across calls sharing the same limits', () => {
		const current = limits({ size: 5 });

		checkSize('abc', current, 'filter');

		// Individually within the allowance, but not on top of the first call
		expect(() => checkSize('abc', current, 'deep')).toThrowError(
			'Invalid query. "deep" exceeds the maximum allowed size.',
		);
	});

	test('should name the parameter in the error', () => {
		expect(() => checkSize('abc', limits({ size: 0 }), 'deep')).toThrowError(
			'Invalid query. "deep" exceeds the maximum allowed size.',
		);
	});
});

describe('checkNode', () => {
	test('should deduct a single node from the remaining allowance', () => {
		const current = limits({ nodes: 3 });

		checkNode(current, 'filter');

		expect(current.nodes).toBe(2);
	});

	test('should accept exactly as many nodes as the allowance', () => {
		const current = limits({ nodes: 2 });

		expect(() => {
			checkNode(current, 'filter');
			checkNode(current, 'filter');
		}).not.toThrow();
	});

	test('should reject the node after the allowance runs out', () => {
		const current = limits({ nodes: 1 });

		checkNode(current, 'filter');

		expect(() => checkNode(current, 'deep')).toThrowError(
			'Invalid query. "deep" exceeds the maximum allowed number of nodes.',
		);
	});
});

describe('checkDepth', () => {
	test('should accept a depth at the maximum', () => {
		expect(() => checkDepth(5, 5, 'filter')).not.toThrow();
	});

	test('should reject a depth one past the maximum', () => {
		expect(() => checkDepth(6, 5, 'filter')).toThrowError(
			'Invalid query. "filter" exceeds the maximum allowed nesting depth.',
		);
	});

	test('should name the parameter in the error', () => {
		expect(() => checkDepth(6, 5, 'deep')).toThrowError(
			'Invalid query. "deep" exceeds the maximum allowed nesting depth.',
		);
	});
});

describe('checkFilterNodes', () => {
	test('should count the root, every container and every leaf', () => {
		const current = limits({ nodes: 100 });

		// root object, the `{ _eq }` object, and the `'x'` leaf
		checkFilterNodes({ field: { _eq: 'x' } }, current);

		expect(current.nodes).toBe(97);
	});

	test('should count array entries', () => {
		const current = limits({ nodes: 100 });

		// root object, the `{ _in }` object, the array, and three leaves
		checkFilterNodes({ field: { _in: ['a', 'b', 'c'] } }, current);

		expect(current.nodes).toBe(94);
	});

	test('should treat a non-plain object as a single leaf', () => {
		const current = limits({ nodes: 100 });

		checkFilterNodes({ field: new Date() }, current);

		expect(current.nodes).toBe(98);
	});

	test('should count a primitive filter as one node', () => {
		const current = limits({ nodes: 100 });

		checkFilterNodes('x', current);

		expect(current.nodes).toBe(99);
	});

	test('should reject once the node allowance runs out', () => {
		expect(() => checkFilterNodes({ a: 'x', b: 'x', c: 'x' }, limits({ nodes: 3 }))).toThrowError(
			'Invalid query. "filter" exceeds the maximum allowed number of nodes.',
		);
	});

	test('should draw from the allowance left by an earlier call', () => {
		const current = limits({ nodes: 4 });
		const filter = { field: { _eq: 'x' } };

		// Fits on its own, but not twice over
		checkFilterNodes(filter, current);

		expect(() => checkFilterNodes(filter, current)).toThrowError(InvalidQueryError);
	});

	test('should accept nesting exactly at the depth limit', () => {
		// Three containers: `{ a }`, `{ b }`, `{ _eq }`
		const filter = { a: { b: { _eq: 'x' } } };

		expect(() => checkFilterNodes(filter, limits({ maxFilterDepth: 3 }))).not.toThrow();
	});

	test('should reject nesting one level past the depth limit', () => {
		const filter = { a: { b: { _eq: 'x' } } };

		expect(() => checkFilterNodes(filter, limits({ maxFilterDepth: 2 }))).toThrowError(
			'Invalid query. "filter" exceeds the maximum allowed nesting depth.',
		);
	});

	test('should not count the array wrapping an `_and` group as a level', () => {
		// `{ _and: [...] }`, then the entry object, then `{ _eq }` — the array is not a level
		const filter = { _and: [{ field: { _eq: 'x' } }] };

		expect(() => checkFilterNodes(filter, limits({ maxFilterDepth: 3 }))).not.toThrow();
		expect(() => checkFilterNodes(filter, limits({ maxFilterDepth: 2 }))).toThrowError(InvalidQueryError);
	});

	test('should charge the same depth however a filter is grouped', () => {
		const ungrouped = { a: { b: { _eq: 'x' } } };
		const grouped = { _and: [{ a: { _and: [{ b: { _and: [{ _eq: 'x' }] } }] } }] };

		// Both reach two relations deep, so grouping must not change the depth charged
		expect(() => checkFilterNodes(ungrouped, limits({ maxFilterDepth: 3 }))).not.toThrow();
		expect(() => checkFilterNodes(grouped, limits({ maxFilterDepth: 6 }))).not.toThrow();
	});

	// Regression test: ten relational levels each wrapped in an `_and` group, which is what the
	// app's filter builder emits. Counting the group's array as a level took this to 33 rather
	// than 22, so it was rejected despite being within `MAX_RELATIONAL_DEPTH`'s default of 10.
	test('should charge a fully grouped filter 2 levels per relation', () => {
		let filter: Record<string, any> = { _and: [{ _eq: 'x' }] };

		for (let level = 0; level < 10; level++) {
			filter = { _and: [{ [`rel_${level}`]: filter }] };
		}

		expect(() => checkFilterNodes(filter, limits({ maxFilterDepth: 22 }))).not.toThrow();
		expect(() => checkFilterNodes(filter, limits({ maxFilterDepth: 21 }))).toThrowError(InvalidQueryError);
	});

	test('should reject input deeper than the call stack without overflowing', () => {
		let filter: Record<string, any> = { _eq: 'x' };

		for (let level = 0; level < 100_000; level++) {
			filter = { a: filter };
		}

		// The walker is iterative, so this is a rejection rather than a RangeError
		expect(() => checkFilterNodes(filter, limits({ nodes: Infinity, maxFilterDepth: 25 }))).toThrowError(
			InvalidQueryError,
		);
	});
});
