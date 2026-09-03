import { DEFAULTS, useEnv } from '@directus/env';
import { InvalidQueryError } from '@directus/errors';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchDynamicVariableData } from '../permissions/utils/fetch-dynamic-variable-data.js';
import { sanitizeQuery } from './sanitize-query.js';

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO
vi.mock('@directus/env', async (importOriginal) => ({
	...(await importOriginal<typeof import('@directus/env')>()),
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('../database/index.js');
vi.mock('../database/helpers/index.js');
vi.mock('../permissions/lib/fetch-policies.js');
vi.mock('../permissions/utils/fetch-dynamic-variable-data.js');

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('limit', () => {
	test.each([-1, 0, 100])('should accept number %i', async (limit) => {
		const sanitizedQuery = await sanitizeQuery({ limit }, null as any);

		expect(sanitizedQuery.limit).toBe(limit);
	});

	test('should accept string 1', async () => {
		const limit = '1';

		const sanitizedQuery = await sanitizeQuery({ limit }, null as any);

		expect(sanitizedQuery.limit).toBe(1);
	});
});

describe('max limit', () => {
	test('should replace -1', async () => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_LIMIT_MAX: 100 });

		const sanitizedQuery = await sanitizeQuery({ limit: -1 }, null as any);

		expect(sanitizedQuery.limit).toBe(100);
	});

	test.each([1, 25, 150])('should accept number %i', async (limit) => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_LIMIT_MAX: 100 });

		const sanitizedQuery = await sanitizeQuery({ limit }, null as any);

		expect(sanitizedQuery.limit).toBe(limit);
	});

	test('should apply max if no limit passed in request', async () => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_LIMIT_DEFAULT: 100, QUERY_LIMIT_MAX: 1000 });

		const sanitizedQuery = await sanitizeQuery({}, null as any);

		expect(sanitizedQuery.limit).toBe(100);
	});

	test('should apply lower value if no limit passed in request', async () => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_LIMIT_MAX: 100, QUERY_LIMIT_DEFAULT: 25 });

		const sanitizedQuery = await sanitizeQuery({}, null as any);

		expect(sanitizedQuery.limit).toBe(25);
	});

	test('should apply limit from request if no max defined', async () => {
		const sanitizedQuery = await sanitizeQuery({ limit: 150 }, null as any);

		expect(sanitizedQuery.limit).toBe(150);
	});

	test('should apply limit from request if max is unlimited', async () => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_LIMIT_MAX: -1 });

		const sanitizedQuery = await sanitizeQuery({ limit: 150 }, null as any);

		expect(sanitizedQuery.limit).toBe(150);
	});
});

describe('fields', () => {
	test.each([undefined, '', null])('should return undefined for  %s', async (value) => {
		const sanitizedQuery = await sanitizeQuery({ fields: value }, null as any);

		expect(sanitizedQuery.fields).toBeUndefined();
	});

	test('should accept valid value', async () => {
		const fields = ['field_a', 'field_b'];

		const sanitizedQuery = await sanitizeQuery({ fields }, null as any);

		expect(sanitizedQuery.fields).toEqual(['field_a', 'field_b']);
	});

	test('should split as csv when it is a string', async () => {
		const fields = 'field_a,field_b';

		const sanitizedQuery = await sanitizeQuery({ fields }, null as any);

		expect(sanitizedQuery.fields).toEqual(['field_a', 'field_b']);
	});

	test('should split as nested csv when it is an array', async () => {
		const fields = ['field_a,field_b', 'field_c'];

		const sanitizedQuery = await sanitizeQuery({ fields }, null as any);

		expect(sanitizedQuery.fields).toEqual(['field_a', 'field_b', 'field_c']);
	});

	test.each([{}, 123])('should throw error for %s input', async (fields) => {
		await expect(sanitizeQuery({ fields }, null as any)).rejects.toThrowError(InvalidQueryError);
	});

	test.each([
		{ value: ['   field_a   '], type: 'array' },
		{ value: '   field_a   ', type: 'string' },
	])('should trim fields for $type', async ({ value: fields }) => {
		const sanitizedQuery = await sanitizeQuery({ fields }, null as any);

		expect(sanitizedQuery.fields).toEqual(['field_a']);
	});
});

describe('group', () => {
	test('should accept valid value', async () => {
		const groupBy = ['group_a', 'group_b'];

		const sanitizedQuery = await sanitizeQuery({ groupBy }, null as any);

		expect(sanitizedQuery.group).toEqual(['group_a', 'group_b']);
	});

	test('should split as csv when it is a string', async () => {
		const groupBy = 'group_a,group_b';

		const sanitizedQuery = await sanitizeQuery({ groupBy }, null as any);

		expect(sanitizedQuery.group).toEqual(['group_a', 'group_b']);
	});

	test('should split as nested csv when it is an array', async () => {
		const groupBy = ['group_a,group_b', 'group_c'];

		const sanitizedQuery = await sanitizeQuery({ groupBy }, null as any);

		expect(sanitizedQuery.group).toEqual(['group_a', 'group_b', 'group_c']);
	});

	test('should trim', async () => {
		const groupBy = ['   group_a   '];

		const sanitizedQuery = await sanitizeQuery({ groupBy }, null as any);

		expect(sanitizedQuery.group).toEqual(['group_a']);
	});
});

describe('aggregate', () => {
	test('should accept valid value', async () => {
		const aggregate = { count: '*' };

		const sanitizedQuery = await sanitizeQuery({ aggregate }, null as any);

		expect(sanitizedQuery.aggregate).toEqual({ count: ['*'] });
	});

	test('should parse as json when it is a string', async () => {
		const aggregate = '{ "count": "*" }';

		const sanitizedQuery = await sanitizeQuery({ aggregate }, null as any);

		expect(sanitizedQuery.aggregate).toEqual({ count: ['*'] });
	});
});

describe('sort', () => {
	test('should accept valid value', async () => {
		const sort = ['field_a', 'field_b'];

		const sanitizedQuery = await sanitizeQuery({ sort }, null as any);

		expect(sanitizedQuery.sort).toEqual(['field_a', 'field_b']);
	});

	test('should split as csv when it is a string', async () => {
		const sort = 'field_a,field_b';

		const sanitizedQuery = await sanitizeQuery({ sort }, null as any);

		expect(sanitizedQuery.sort).toEqual(['field_a', 'field_b']);
	});

	test('should trim csv array results', async () => {
		const sort = 'field_a, field_b';

		const sanitizedQuery = await sanitizeQuery({ sort }, null as any);

		expect(sanitizedQuery.sort).toEqual(['field_a', 'field_b']);
	});
});

describe('filter', () => {
	test('should accept valid filter', async () => {
		const filter = { field_a: { _eq: 'test' } };

		const sanitizedQuery = await sanitizeQuery({ filter }, null as any);

		expect(sanitizedQuery.filter).toEqual({ field_a: { _eq: 'test' } });
	});

	test('should throw error on invalid filter', async () => {
		const filter = { field_a: null };

		await expect(async () => await sanitizeQuery({ filter }, null as any)).rejects.toThrowError(
			'Invalid query. Invalid filter object.',
		);
	});

	test('should parse as json when it is a string', async () => {
		const filter = '{ "field_a": { "_eq": "test" } }';

		const sanitizedQuery = await sanitizeQuery({ filter }, null as any);

		expect(sanitizedQuery.filter).toEqual({ field_a: { _eq: 'test' } });
	});

	test('should throw error on invalid json', async () => {
		const filter = '{ "field_a": }';

		await expect(async () => await sanitizeQuery({ filter }, null as any)).rejects.toThrowError(
			'Invalid query. Invalid JSON for filter object.',
		);
	});

	test('should process dynamic variables', async () => {
		const filter = { field_a: { _eq: '$CURRENT_USER.something' } };

		vi.mocked(fetchDynamicVariableData).mockResolvedValue({ $CURRENT_USER: { something: 'test' } });

		const sanitizedQuery = await sanitizeQuery({ filter }, null as any, {} as any);

		expect(sanitizedQuery.filter).toEqual({ field_a: { _eq: 'test' } });
	});
});

describe('query limits', () => {
	const FILTER_PREFIX = '{"a":{"_eq":"';
	const FILTER_SUFFIX = '"}}';

	/** A filter that serializes to exactly `length` characters */
	function filterOfSize(length: number) {
		return FILTER_PREFIX + 'x'.repeat(length - FILTER_PREFIX.length - FILTER_SUFFIX.length) + FILTER_SUFFIX;
	}

	/** A filter with `count` leaves, so `count + 1` nodes including the root object */
	function filterWithLeaves(count: number) {
		return Object.fromEntries(Array.from({ length: count }, (_, index) => [`field_${index}`, 'x']));
	}

	/**
	 * A filter nested `depth` containers deep, the innermost being the operator object. Built
	 * iteratively so the helper itself survives depths beyond the call stack.
	 */
	function filterOfDepth(depth: number): Record<string, any> {
		let filter: Record<string, any> = { _eq: 'x' };

		for (let level = 1; level < depth; level++) {
			filter = { a: filter };
		}

		return filter;
	}

	/** A `deep` value with `levels` nested relations, carrying `subQuery` at the innermost level */
	function deepOfDepth(levels: number, subQuery: Record<string, any>): Record<string, any> {
		return levels <= 0 ? subQuery : { [`relation_${levels}`]: deepOfDepth(levels - 1, subQuery) };
	}

	describe('filter size', () => {
		test('should accept a filter at the size limit', async () => {
			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_SIZE: 64 });

			const sanitizedQuery = await sanitizeQuery({ filter: filterOfSize(64) }, null as any);

			expect(sanitizedQuery.filter).toEqual({ a: { _eq: 'x'.repeat(48) } });
		});

		test('should reject a filter one character over the size limit', async () => {
			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_SIZE: 64 });

			await expect(sanitizeQuery({ filter: filterOfSize(65) }, null as any)).rejects.toThrowError(InvalidQueryError);
		});

		test('should reject a `deep` string over the size limit', async () => {
			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_SIZE: 20 });

			await expect(sanitizeQuery({ deep: '{"relation_1":{"_limit":1}}' }, null as any)).rejects.toThrowError(
				InvalidQueryError,
			);
		});
	});

	describe('filter nodes', () => {
		test('should accept a filter at the node limit', async () => {
			// 5 leaves + the root object
			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_NODES: 6 });

			const sanitizedQuery = await sanitizeQuery({ filter: filterWithLeaves(5) }, null as any);

			expect(sanitizedQuery.filter).toEqual({
				_and: [
					{ field_0: { _eq: 'x' } },
					{ field_1: { _eq: 'x' } },
					{ field_2: { _eq: 'x' } },
					{ field_3: { _eq: 'x' } },
					{ field_4: { _eq: 'x' } },
				],
			});
		});

		test('should reject a filter one node over the limit', async () => {
			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_NODES: 5 });

			await expect(sanitizeQuery({ filter: filterWithLeaves(5) }, null as any)).rejects.toThrowError(InvalidQueryError);
		});
	});

	describe('filter depth', () => {
		test('should accept a filter at the depth limit', async () => {
			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_DEPTH: 5 });

			const sanitizedQuery = await sanitizeQuery({ filter: filterOfDepth(5) }, null as any);

			expect(sanitizedQuery.filter).toEqual({ a: { a: { a: { a: { _eq: 'x' } } } } });
		});

		test('should reject a filter one level over the depth limit', async () => {
			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_DEPTH: 5 });

			await expect(sanitizeQuery({ filter: filterOfDepth(6) }, null as any)).rejects.toThrowError(InvalidQueryError);
		});

		test('should reject a filter deeper than the call stack without overflowing', async () => {
			await expect(sanitizeQuery({ filter: filterOfDepth(50_000) }, null as any)).rejects.toThrowError(
				InvalidQueryError,
			);
		});
	});

	describe('deep depth', () => {
		test('should accept `deep` at the depth limit', async () => {
			vi.mocked(useEnv).mockReturnValue({ QUERY_DEEP_MAX_DEPTH: 3 });

			const sanitizedQuery = await sanitizeQuery({ deep: deepOfDepth(3, { _limit: 1 }) }, null as any);

			expect(sanitizedQuery.deep).toEqual(deepOfDepth(3, { _limit: 1 }));
		});

		test('should reject `deep` one level over the depth limit', async () => {
			vi.mocked(useEnv).mockReturnValue({ QUERY_DEEP_MAX_DEPTH: 3 });

			await expect(sanitizeQuery({ deep: deepOfDepth(4, { _limit: 1 }) }, null as any)).rejects.toThrowError(
				InvalidQueryError,
			);
		});
	});

	// `sanitizeDeep` recurses back into `sanitizeQuery` for every nested `_filter`. If each call got
	// its own allowance, nesting would multiply the work a single request can cause, so these assert
	// the allowance is one shared pool rather than a per-call check.
	describe('shared allowance across `deep`', () => {
		test('should share the node allowance across `deep` levels', async () => {
			// 11 nodes, so the per-filter cost dominates the cost of walking `deep` itself and the
			// assertions below cannot be satisfied by a per-call allowance
			const filter = filterWithLeaves(10);

			// One relation level costs 13 nodes (2 for `deep`, 11 for the filter); five cost 65
			const oneLevel = { relation_1: { _filter: filter } };

			const fiveLevels = {
				relation_1: {
					_filter: filter,
					relation_2: {
						_filter: filter,
						relation_3: {
							_filter: filter,
							relation_4: { _filter: filter, relation_5: { _filter: filter } },
						},
					},
				},
			};

			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_NODES: 20 });
			await expect(sanitizeQuery({ deep: oneLevel }, null as any)).resolves.toBeDefined();

			// Same allowance, five copies of a filter that each fit comfortably on their own. A
			// per-call allowance would admit this; a shared one must not.
			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_NODES: 20 });
			await expect(sanitizeQuery({ deep: fiveLevels }, null as any)).rejects.toThrowError(InvalidQueryError);

			// Raising the allowance to cover all five lets it through, so nothing else rejected it
			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_NODES: 100 });
			await expect(sanitizeQuery({ deep: fiveLevels }, null as any)).resolves.toBeDefined();
		});

		test('should share the size allowance across `deep` levels', async () => {
			const filter = filterOfSize(40);

			const oneLevel = { relation_1: { _filter: filter } };

			const threeLevels = {
				relation_1: { _filter: filter, relation_2: { _filter: filter, relation_3: { _filter: filter } } },
			};

			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_SIZE: 60 });
			await expect(sanitizeQuery({ deep: oneLevel }, null as any)).resolves.toBeDefined();

			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_SIZE: 60 });
			await expect(sanitizeQuery({ deep: threeLevels }, null as any)).rejects.toThrowError(InvalidQueryError);

			vi.mocked(useEnv).mockReturnValue({ QUERY_FILTER_MAX_SIZE: 200 });
			await expect(sanitizeQuery({ deep: threeLevels }, null as any)).resolves.toBeDefined();
		});
	});

	test('should leave a relational query within the shipped limits untouched', async () => {
		// The merged `DEFAULTS`, so the limits are read the way production reads them
		vi.mocked(useEnv).mockReturnValue(DEFAULTS);

		const filter = { author: { role: { name: { _eq: 'admin' } } } };
		const deep = { translations: { _filter: filter, _limit: 10 } };

		const sanitizedQuery = await sanitizeQuery({ filter, deep }, null as any);

		expect(sanitizedQuery.filter).toEqual(filter);
		expect(sanitizedQuery.deep).toEqual({ translations: { _filter: filter, _limit: 10 } });
	});

	// The app's filter builder wraps every relational level in an `_and` group. With the group's
	// array counted as a nesting level this reached depth 33 and was rejected under the shipped
	// limits, despite being within `MAX_RELATIONAL_DEPTH`'s default of 10.
	test('should accept a fully grouped relational filter at the shipped limits', async () => {
		vi.mocked(useEnv).mockReturnValue(DEFAULTS);

		let filter: Record<string, any> = { _and: [{ name: { _eq: 'admin' } }] };

		for (let level = 0; level < 10; level++) {
			filter = { _and: [{ [`rel_${level}`]: filter }] };
		}

		await expect(sanitizeQuery({ filter }, null as any)).resolves.toBeDefined();
	});
});

describe('offset', () => {
	test('should accept number 1', async () => {
		const offset = 1;

		const sanitizedQuery = await sanitizeQuery({ offset }, null as any);

		expect(sanitizedQuery.offset).toBe(1);
	});

	test('should accept string 1', async () => {
		const offset = '1';

		const sanitizedQuery = await sanitizeQuery({ offset }, null as any);

		expect(sanitizedQuery.offset).toBe(1);
	});

	test('should accept zero #18370', async () => {
		const offset = 0;

		const sanitizedQuery = await sanitizeQuery({ offset }, null as any);

		expect(sanitizedQuery.offset).toBe(0);
	});

	test('should accept string zero #18370', async () => {
		const offset = '0';

		const sanitizedQuery = await sanitizeQuery({ offset }, null as any);

		expect(sanitizedQuery.offset).toBe(0);
	});
});

describe('page', () => {
	test('should accept number 1', async () => {
		const page = 1;

		const sanitizedQuery = await sanitizeQuery({ page }, null as any);

		expect(sanitizedQuery.page).toBe(1);
	});

	test('should accept string 1', async () => {
		const page = '1';

		const sanitizedQuery = await sanitizeQuery({ page }, null as any);

		expect(sanitizedQuery.page).toBe(1);
	});

	test('should ignore zero', async () => {
		const page = 0;

		const sanitizedQuery = await sanitizeQuery({ page }, null as any);

		expect(sanitizedQuery.page).toBeUndefined();
	});
});

describe('meta', () => {
	test.each([
		{ input: '*', expected: ['total_count', 'filter_count'] },
		{ input: 'total_count', expected: ['total_count'] },
		{ input: 'total_count,filter_count', expected: ['total_count', 'filter_count'] },
		{ input: ['total_count', 'filter_count'], expected: ['total_count', 'filter_count'] },
	])('should accept $input', async ({ input, expected }) => {
		const sanitizedQuery = (await sanitizeQuery({ meta: input }, null as any)) as any;

		expect(sanitizedQuery.meta).toEqual(expected);
	});
});

describe('search', () => {
	test('should accept valid value', async () => {
		const search = 'test';

		const sanitizedQuery = await sanitizeQuery({ search }, null as any);

		expect(sanitizedQuery.search).toBe('test');
	});

	test('should ignore non-string', async () => {
		const search = ['test'];

		const sanitizedQuery = await sanitizeQuery({ search }, null as any);

		expect(sanitizedQuery.search).toBeUndefined();
	});

	test('should trim leading and trailing spaces', async () => {
		const sanitizedQuery = await sanitizeQuery({ search: '  glaglagla !  ' }, null as any);

		expect(sanitizedQuery.search).toBe('glaglagla !');
	});

	test('should still allow for a whitespace-only search', async () => {
		const sanitizedQuery = await sanitizeQuery({ search: '   ' }, null as any);

		expect(sanitizedQuery.search).toBe('   ');
	});
});

describe('export', () => {
	test('should accept valid value', async () => {
		const format = 'json';

		const sanitizedQuery = await sanitizeQuery({ export: format }, null as any);

		expect(sanitizedQuery.export).toBe('json');
	});
});

describe('deep', () => {
	test('should accept valid value', async () => {
		const deep = { deep: { relational_field: { _sort: ['name'] } } };

		const sanitizedQuery = await sanitizeQuery({ deep }, null as any);

		expect(sanitizedQuery.deep).toEqual({ deep: { relational_field: { _sort: ['name'] } } });
	});

	test('should parse as json when it is a string', async () => {
		const deep = { deep: { relational_field: { _sort: ['name'] } } };

		const sanitizedQuery = await sanitizeQuery({ deep }, null as any);

		expect(sanitizedQuery.deep).toEqual({ deep: { relational_field: { _sort: ['name'] } } });
	});

	test('should ignore non-underscore-prefixed queries', async () => {
		const deep = { deep: { relational_field_a: { _sort: ['name'] }, relational_field_b: { sort: ['name'] } } };

		const sanitizedQuery = await sanitizeQuery({ deep }, null as any);

		expect(sanitizedQuery.deep).toEqual({ deep: { relational_field_a: { _sort: ['name'] } } });
	});

	test('should work in combination with query limit', async () => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_LIMIT_DEFAULT: 100, QUERY_LIMIT_MAX: 1000 });

		const deep = { deep: { relational_field_a: { _sort: ['name'] } } };

		const sanitizedQuery = await sanitizeQuery({ deep }, null as any);

		expect(sanitizedQuery.deep).toEqual({ deep: { relational_field_a: { _limit: 100, _sort: ['name'] } } });
	});

	test('should convert nested filters with dynamic variables to corresponding values', async () => {
		const deep = {
			deep: {
				relational_field: {
					_filter: { name: { _eq: '$CURRENT_USER.something' } },
				},
			},
		};

		vi.mocked(fetchDynamicVariableData).mockResolvedValue({ $CURRENT_USER: { something: 'test' } });

		const sanitizedQuery = await sanitizeQuery({ deep }, null as any, {} as any);

		expect(sanitizedQuery.deep).toEqual({
			deep: {
				relational_field: {
					_filter: { name: { _eq: 'test' } },
				},
			},
		});
	});

	// Regression tests for GHSA-gwvv-rr68-cmv6: a `deep` key that names an inherited builtin (e.g.
	// `toString`) must not be walked into while building the query object, as that corrupts a shared
	// prototype and crashes the process. These keys bypass the classic
	// `__proto__`/`constructor`/`prototype` blocklists, so the fix contains the write on a plain
	// object instead of touching the builtin.
	describe('prototype pollution (GHSA-gwvv-rr68-cmv6)', () => {
		test.each([
			'{"toString":{"call":{"_limit":1}}}',
			'{"hasOwnProperty":{"x":{"_limit":1}}}',
			'{"valueOf":{"x":{"_limit":1}}}',
			'{"isPrototypeOf":{"x":{"_limit":1}}}',
			'{"constructor":{"x":{"_limit":1}}}',
			'{"__proto__":{"polluted":{"_limit":1}}}',
		])('should not corrupt a builtin when deep string names one: %s', async (deep) => {
			const original = Object.prototype.toString.call;

			// Must not throw and, crucially, must not mutate the shared builtin
			await expect(sanitizeQuery({ deep }, null as any)).resolves.toBeDefined();

			expect(Object.prototype.toString.call).toBe(original);
			expect(typeof Object.prototype.toString.call).toBe('function');
			expect(({} as any).polluted).toBeUndefined();
		});

		test('should not corrupt Object.prototype when a builtin key is nested below a real relation', async () => {
			const original = Object.prototype.toString.call;

			await expect(
				sanitizeQuery({ deep: { real_relation: { toString: { call: { _limit: 1 } } } } }, null as any),
			).resolves.toBeDefined();

			expect(Object.prototype.toString.call).toBe(original);
			// The standard type-tag check (used across Node/pino/dateformat) must still work
			expect(Object.prototype.toString.call([])).toBe('[object Array]');
		});

		test('keeps a builtin-named deep key as harmless own data', async () => {
			const sanitizedQuery = await sanitizeQuery({ deep: '{"toString":{"call":{"_limit":1}}}' }, null as any);

			expect(sanitizedQuery.deep).toEqual({ toString: { call: { _limit: 1 } } });
		});
	});
});

describe('alias', () => {
	test('should accept valid value', async () => {
		const alias = { field_a: 'testField' };

		const sanitizedQuery = await sanitizeQuery({ alias }, null as any);

		expect(sanitizedQuery.alias).toEqual({ field_a: 'testField' });
	});

	test('should parse as json when it is a string', async () => {
		const alias = '{ "field_a": "testField" }';

		const sanitizedQuery = await sanitizeQuery({ alias }, null as any);

		expect(sanitizedQuery.alias).toEqual({ field_a: 'testField' });
	});
});
