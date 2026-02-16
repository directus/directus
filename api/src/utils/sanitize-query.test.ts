import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getHelpers } from '../database/helpers/index.js';
import { fetchDynamicVariableData } from '../permissions/utils/fetch-dynamic-variable-data.js';
import { sanitizeQuery } from './sanitize-query.js';

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO
vi.mock('@directus/env', () => ({ useEnv: vi.fn().mockReturnValue({}) }));

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

	test('should trim', async () => {
		const fields = ['   field_a   '];

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

describe('json function support check', () => {
	function mockJsonSupport(supported: boolean) {
		vi.mocked(getHelpers).mockReturnValue({
			capabilities: {
				supportsJsonQueries: vi.fn().mockResolvedValue(supported),
			},
		} as any);
	}

	test('should allow json() in fields when supported', async () => {
		mockJsonSupport(true);

		const query = await sanitizeQuery({ fields: ['id', 'json(metadata, color)'] }, null as any);

		expect(query.fields).toEqual(['id', 'json(metadata, color)']);
	});

	test('should allow regular fields when not supported', async () => {
		mockJsonSupport(false);

		const query = await sanitizeQuery({ fields: ['id', 'name'] }, null as any);

		expect(query.fields).toEqual(['id', 'name']);
	});

	test('should reject json() in fields when not supported', async () => {
		mockJsonSupport(false);

		await expect(sanitizeQuery({ fields: ['id', 'json(metadata, color)'] }, null as any)).rejects.toThrowError(
			'json() function is not supported',
		);
	});

	test('should reject relational json() in fields when not supported', async () => {
		mockJsonSupport(false);

		await expect(sanitizeQuery({ fields: ['author.json(profile, avatar)'] }, null as any)).rejects.toThrowError(
			'json() function is not supported',
		);
	});

	test('should not call supportsJsonQueries when no json functions present', async () => {
		const supportsJsonQueries = vi.fn();

		vi.mocked(getHelpers).mockReturnValue({
			capabilities: { supportsJsonQueries },
		} as any);

		await sanitizeQuery({ fields: ['id', 'name'], sort: 'name' }, null as any);

		expect(supportsJsonQueries).not.toHaveBeenCalled();
	});
});
