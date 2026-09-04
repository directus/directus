import { DEFAULTS, useEnv } from '@directus/env';
import { InvalidQueryError } from '@directus/errors';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getQueryLimits, QueryLimits, type QueryMaximums } from './query-limits.js';

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
function limits(overrides: Partial<QueryMaximums> = {}): QueryLimits {
	return new QueryLimits({
		maxSize: 1000,
		maxNodes: 1000,
		maxFilterDepth: 100,
		maxDeepDepth: 100,
		...overrides,
	});
}

describe('fromEnv', () => {
	test('should read the limits from the environment', () => {
		vi.mocked(useEnv).mockReturnValue({
			QUERY_FILTER_MAX_SIZE: 111,
			QUERY_FILTER_MAX_NODES: 222,
			QUERY_FILTER_MAX_DEPTH: 33,
			QUERY_DEEP_MAX_DEPTH: 44,
		});

		expect(getQueryLimits()).toMatchObject({
			maxSize: 111,
			maxNodes: 222,
			maxFilterDepth: 33,
			maxDeepDepth: 44,
		});
	});

	test('should use the shipped defaults', () => {
		expect(getQueryLimits()).toMatchObject({
			maxSize: 32_768,
			maxNodes: 10_000,
			maxFilterDepth: 50,
			maxDeepDepth: 20,
		});

		expect(warn).not.toHaveBeenCalled();
	});

	test('should start with the full allowance unspent', () => {
		const current = getQueryLimits();

		expect(current.remainingSize).toBe(current.maxSize);
		expect(current.remainingNodes).toBe(current.maxNodes);
	});

	test('should fall back silently when the key is absent', () => {
		// Only reachable when the env was never built, so it is not a misconfiguration
		vi.mocked(useEnv).mockReturnValue({});

		expect(getQueryLimits().maxNodes).toBe(10_000);
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

		expect(getQueryLimits().maxNodes).toBe(10_000);
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

		expect(getQueryLimits().maxNodes).toBe(500);
	});

	test('should honor `Infinity` as an explicit opt-out', () => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_NODES: Infinity });

		expect(getQueryLimits().maxNodes).toBe(Infinity);
	});
});

describe('chargeSize', () => {
	test('should deduct the input length from the remaining allowance', () => {
		const current = limits({ maxSize: 10 });

		current.chargeSize('abc', 'filter');

		expect(current.remainingSize).toBe(7);
	});

	test('should accept input exactly at the allowance', () => {
		expect(() => limits({ maxSize: 5 }).chargeSize('abcde', 'filter')).not.toThrow();
	});

	test('should reject input one character over the allowance', () => {
		expect(() => limits({ maxSize: 5 }).chargeSize('abcdef', 'filter')).toThrowError(
			'Invalid query. "filter" exceeds the maximum allowed size of 5 characters.',
		);
	});

	test('should accumulate across calls sharing the same limits', () => {
		const current = limits({ maxSize: 5 });

		current.chargeSize('abc', 'filter');

		expect(() => current.chargeSize('abc', 'deep')).toThrowError(
			'Invalid query. "deep" exceeds the maximum allowed size of',
		);
	});
});

describe('chargeNode', () => {
	test('should deduct a single node from the remaining allowance', () => {
		const current = limits({ maxNodes: 3 });

		current.chargeNode('filter');

		expect(current.remainingNodes).toBe(2);
	});

	test('should accept exactly as many nodes as the allowance', () => {
		const current = limits({ maxNodes: 2 });

		expect(() => {
			current.chargeNode('filter');
			current.chargeNode('filter');
		}).not.toThrow();
	});

	test('should reject the node after the allowance runs out', () => {
		const current = limits({ maxNodes: 1 });

		current.chargeNode('filter');

		// Reports the maximum, not what is left
		expect(() => current.chargeNode('deep')).toThrowError(
			'Invalid query. "deep" exceeds the maximum allowed node count of 1.',
		);
	});
});

describe('withDeepLevel', () => {
	test('should run the level and return its result', async () => {
		await expect(limits().withDeepLevel(async () => 'result')).resolves.toBe('result');
	});

	test('should accept nesting exactly at the depth limit', async () => {
		const current = limits({ maxDeepDepth: 2 });

		await expect(current.withDeepLevel(() => current.withDeepLevel(async () => 'result'))).resolves.toBe('result');
	});

	test('should reject nesting one level past the limit', async () => {
		const current = limits({ maxDeepDepth: 1 });

		await expect(current.withDeepLevel(() => current.withDeepLevel(async () => 'result'))).rejects.toThrowError(
			'Invalid query. "deep" exceeds the maximum allowed nesting depth of 1.',
		);
	});

	test('should not run a level it rejects', async () => {
		const current = limits({ maxDeepDepth: 0 });
		const run = vi.fn();

		await expect(current.withDeepLevel(run)).rejects.toThrowError(InvalidQueryError);
		expect(run).not.toHaveBeenCalled();
	});

	test('should release the level on the way out', async () => {
		// One instance spans a whole selection set, so siblings must not accumulate
		const current = limits({ maxDeepDepth: 1 });

		await current.withDeepLevel(async () => 'first');

		await expect(current.withDeepLevel(async () => 'second')).resolves.toBe('second');
	});

	test('should release the level even when the level throws', async () => {
		const current = limits({ maxDeepDepth: 1 });

		await expect(
			current.withDeepLevel(() => {
				throw new Error('inner');
			}),
		).rejects.toThrowError('inner');

		await expect(current.withDeepLevel(async () => 'result')).resolves.toBe('result');
	});
});

describe('chargeFilterNodes', () => {
	test('should count the root, every container and every leaf', () => {
		const current = limits({ maxNodes: 100 });

		current.chargeFilterNodes({ field: { _eq: 'x' } });

		expect(current.remainingNodes).toBe(97);
	});

	test('should count array entries', () => {
		const current = limits({ maxNodes: 100 });

		current.chargeFilterNodes({ field: { _in: ['a', 'b', 'c'] } });

		expect(current.remainingNodes).toBe(94);
	});

	test('should treat a non-plain object as a single leaf', () => {
		const current = limits({ maxNodes: 100 });

		current.chargeFilterNodes({ field: new Date() });

		expect(current.remainingNodes).toBe(98);
	});

	test('should count a primitive filter as one node', () => {
		const current = limits({ maxNodes: 100 });

		current.chargeFilterNodes('x');

		expect(current.remainingNodes).toBe(99);
	});

	test('should reject once the node allowance runs out', () => {
		expect(() => limits({ maxNodes: 3 }).chargeFilterNodes({ a: 'x', b: 'x', c: 'x' })).toThrowError(
			'Invalid query. "filter" exceeds the maximum allowed node count of',
		);
	});

	test('should draw from the allowance left by an earlier call', () => {
		const current = limits({ maxNodes: 4 });
		const filter = { field: { _eq: 'x' } };

		current.chargeFilterNodes(filter);

		expect(() => current.chargeFilterNodes(filter)).toThrowError(InvalidQueryError);
	});

	test('should accept nesting exactly at the depth limit', () => {
		const filter = { a: { b: { _eq: 'x' } } };

		expect(() => limits({ maxFilterDepth: 3 }).chargeFilterNodes(filter)).not.toThrow();
	});

	test('should reject nesting one level past the depth limit', () => {
		const filter = { a: { b: { _eq: 'x' } } };

		expect(() => limits({ maxFilterDepth: 2 }).chargeFilterNodes(filter)).toThrowError(
			'Invalid query. "filter" exceeds the maximum allowed nesting depth of 2.',
		);
	});

	test('should not count the array wrapping an `_and` group as a level', () => {
		const filter = { _and: [{ field: { _eq: 'x' } }] };

		expect(() => limits({ maxFilterDepth: 3 }).chargeFilterNodes(filter)).not.toThrow();
		expect(() => limits({ maxFilterDepth: 2 }).chargeFilterNodes(filter)).toThrowError(InvalidQueryError);
	});

	test('should charge the same depth however a filter is grouped', () => {
		const ungrouped = { a: { b: { _eq: 'x' } } };
		const grouped = { _and: [{ a: { _and: [{ b: { _and: [{ _eq: 'x' }] } }] } }] };

		expect(() => limits({ maxFilterDepth: 3 }).chargeFilterNodes(ungrouped)).not.toThrow();
		expect(() => limits({ maxFilterDepth: 6 }).chargeFilterNodes(grouped)).not.toThrow();
	});

	// The shape the app's filter builder emits. Counting the group's array as a level takes this
	// to 33 rather than 22, rejecting a filter within `MAX_RELATIONAL_DEPTH`'s default of 10.
	test('should charge a fully grouped filter 2 levels per relation', () => {
		let filter: Record<string, any> = { _and: [{ _eq: 'x' }] };

		for (let level = 0; level < 10; level++) {
			filter = { _and: [{ [`rel_${level}`]: filter }] };
		}

		expect(() => limits({ maxFilterDepth: 22 }).chargeFilterNodes(filter)).not.toThrow();
		expect(() => limits({ maxFilterDepth: 21 }).chargeFilterNodes(filter)).toThrowError(InvalidQueryError);
	});

	test('should report every value it does not walk into', () => {
		const leaves: unknown[] = [];

		limits().chargeFilterNodes({ a: { _in: ['x', 2] }, b: { _eq: null } }, (value) => leaves.push(value));

		expect(leaves.sort()).toEqual([2, null, 'x'].sort());
	});

	test('should not report the filter itself as a value', () => {
		const leaves: unknown[] = [];

		limits().chargeFilterNodes('x', (value) => leaves.push(value));

		expect(leaves).toEqual([]);
	});

	test('should report a value nested in an array at the root', () => {
		const leaves: unknown[] = [];

		limits().chargeFilterNodes(['x'], (value) => leaves.push(value));

		expect(leaves).toEqual(['x']);
	});

	test('should reject input deeper than the call stack without overflowing', () => {
		let filter: Record<string, any> = { _eq: 'x' };

		for (let level = 0; level < 100_000; level++) {
			filter = { a: filter };
		}

		// Iterative, so this rejects rather than overflowing
		expect(() => limits({ maxNodes: Infinity, maxFilterDepth: 25 }).chargeFilterNodes(filter)).toThrowError(
			InvalidQueryError,
		);
	});
});
