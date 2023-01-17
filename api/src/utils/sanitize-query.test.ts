import { describe, expect, test, vi } from 'vitest';

import { sanitizeQuery } from './sanitize-query';

vi.mock('@directus/shared/utils', async () => {
	const actual = (await vi.importActual('@directus/shared/utils')) as any;

	return {
		...actual,
		parseFilter: vi.fn().mockImplementation((value) => value),
	};
});

describe('limit', () => {
	test.each([-1, 0, 100])('should accept number %i', (limit) => {
		const sanitizedQuery = sanitizeQuery({ limit });

		expect(sanitizedQuery.limit).toBe(limit);
	});

	test('should accept string 1', () => {
		const limit = '1';

		const sanitizedQuery = sanitizeQuery({ limit });

		expect(sanitizedQuery.limit).toBe(1);
	});
});

describe('fields', () => {
	test('should accept valid value', () => {
		const fields = ['field_a', 'field_b'];

		const sanitizedQuery = sanitizeQuery({ fields });

		expect(sanitizedQuery.fields).toEqual(['field_a', 'field_b']);
	});

	test('should split as csv when it is a string', () => {
		const fields = 'field_a,field_b';

		const sanitizedQuery = sanitizeQuery({ fields });

		expect(sanitizedQuery.fields).toEqual(['field_a', 'field_b']);
	});

	test('should split as nested csv when it is an array', () => {
		const fields = ['field_a,field_b', 'field_c'];

		const sanitizedQuery = sanitizeQuery({ fields });

		expect(sanitizedQuery.fields).toEqual(['field_a', 'field_b', 'field_c']);
	});

	test('should trim', () => {
		const fields = ['   field_a   '];

		const sanitizedQuery = sanitizeQuery({ fields });

		expect(sanitizedQuery.fields).toEqual(['field_a']);
	});
});

describe('group', () => {
	test('should accept valid value', () => {
		const groupBy = ['group_a', 'group_b'];

		const sanitizedQuery = sanitizeQuery({ groupBy });

		expect(sanitizedQuery.group).toEqual(['group_a', 'group_b']);
	});

	test('should split as csv when it is a string', () => {
		const groupBy = 'group_a,group_b';

		const sanitizedQuery = sanitizeQuery({ groupBy });

		expect(sanitizedQuery.group).toEqual(['group_a', 'group_b']);
	});

	test('should split as nested csv when it is an array', () => {
		const groupBy = ['group_a,group_b', 'group_c'];

		const sanitizedQuery = sanitizeQuery({ groupBy });

		expect(sanitizedQuery.group).toEqual(['group_a', 'group_b', 'group_c']);
	});

	test('should trim', () => {
		const groupBy = ['   group_a   '];

		const sanitizedQuery = sanitizeQuery({ groupBy });

		expect(sanitizedQuery.group).toEqual(['group_a']);
	});
});

describe('aggregate', () => {
	test('should accept valid value', () => {
		const aggregate = { count: '*' };

		const sanitizedQuery = sanitizeQuery({ aggregate });

		expect(sanitizedQuery.aggregate).toEqual({ count: ['*'] });
	});

	test('should parse as json when it is a string', () => {
		const aggregate = '{ "count": "*" }';

		const sanitizedQuery = sanitizeQuery({ aggregate });

		expect(sanitizedQuery.aggregate).toEqual({ count: ['*'] });
	});
});

describe('sort', () => {
	test('should accept valid value', () => {
		const sort = ['field_a', 'field_b'];

		const sanitizedQuery = sanitizeQuery({ sort });

		expect(sanitizedQuery.sort).toEqual(['field_a', 'field_b']);
	});

	test('should split as csv when it is a string', () => {
		const sort = 'field_a,field_b';

		const sanitizedQuery = sanitizeQuery({ sort });

		expect(sanitizedQuery.sort).toEqual(['field_a', 'field_b']);
	});
});

describe('filter', () => {
	test('should accept valid value', () => {
		const filter = { field_a: { _eq: 'test' } };

		const sanitizedQuery = sanitizeQuery({ filter });

		expect(sanitizedQuery.filter).toEqual({ field_a: { _eq: 'test' } });
	});

	test('should parse as json when it is a string', () => {
		const filter = '{ "field_a": { "_eq": "test" } }';

		const sanitizedQuery = sanitizeQuery({ filter });

		expect(sanitizedQuery.filter).toEqual({ field_a: { _eq: 'test' } });
	});
});

describe('offset', () => {
	test('should accept number 1', () => {
		const offset = 1;

		const sanitizedQuery = sanitizeQuery({ offset });

		expect(sanitizedQuery.offset).toBe(1);
	});

	test('should accept string 1', () => {
		const offset = '1';

		const sanitizedQuery = sanitizeQuery({ offset });

		expect(sanitizedQuery.offset).toBe(1);
	});

	test('should ignore zero', () => {
		const offset = 0;

		const sanitizedQuery = sanitizeQuery({ offset });

		expect(sanitizedQuery.offset).toBeUndefined();
	});
});

describe('page', () => {
	test('should accept number 1', () => {
		const page = 1;

		const sanitizedQuery = sanitizeQuery({ page });

		expect(sanitizedQuery.page).toBe(1);
	});

	test('should accept string 1', () => {
		const page = '1';

		const sanitizedQuery = sanitizeQuery({ page });

		expect(sanitizedQuery.page).toBe(1);
	});

	test('should ignore zero', () => {
		const page = 0;

		const sanitizedQuery = sanitizeQuery({ page });

		expect(sanitizedQuery.page).toBeUndefined();
	});
});

describe('meta', () => {
	test.each([
		{ input: '*', expected: ['total_count', 'filter_count'] },
		{ input: 'total_count', expected: ['total_count'] },
		{ input: 'total_count,filter_count', expected: ['total_count', 'filter_count'] },
		{ input: ['total_count', 'filter_count'], expected: ['total_count', 'filter_count'] },
	])('should accept $input', ({ input, expected }) => {
		const sanitizedQuery = sanitizeQuery({ meta: input }) as any;

		expect(sanitizedQuery.meta).toEqual(expected);
	});
});

describe('search', () => {
	test('should accept valid value', () => {
		const search = 'test';

		const sanitizedQuery = sanitizeQuery({ search });

		expect(sanitizedQuery.search).toBe('test');
	});

	test('should ignore non-string', () => {
		const search = ['test'];

		const sanitizedQuery = sanitizeQuery({ search });

		expect(sanitizedQuery.search).toBeUndefined();
	});
});

describe('export', () => {
	test('should accept valid value', () => {
		const format = 'json';

		const sanitizedQuery = sanitizeQuery({ export: format });

		expect(sanitizedQuery.export).toBe('json');
	});
});

describe('deep', () => {
	test('should accept valid value', () => {
		const deep = { deep: { relational_field: { _sort: ['name'] } } };

		const sanitizedQuery = sanitizeQuery({ deep });

		expect(sanitizedQuery.deep).toEqual({ deep: { relational_field: { _sort: ['name'] } } });
	});

	test('should parse as json when it is a string', () => {
		const deep = { deep: { relational_field: { _sort: ['name'] } } };

		const sanitizedQuery = sanitizeQuery({ deep });

		expect(sanitizedQuery.deep).toEqual({ deep: { relational_field: { _sort: ['name'] } } });
	});

	test('should ignore non-underscore-prefixed queries', () => {
		const deep = { deep: { relational_field_a: { _sort: ['name'] }, relational_field_b: { sort: ['name'] } } };

		const sanitizedQuery = sanitizeQuery({ deep });

		expect(sanitizedQuery.deep).toEqual({ deep: { relational_field_a: { _sort: ['name'] } } });
	});
});

describe('alias', () => {
	test('should accept valid value', () => {
		const alias = { field_a: 'testField' };

		const sanitizedQuery = sanitizeQuery({ alias });

		expect(sanitizedQuery.alias).toEqual({ field_a: 'testField' });
	});

	test('should parse as json when it is a string', () => {
		const alias = '{ "field_a": "testField" }';

		const sanitizedQuery = sanitizeQuery({ alias });

		expect(sanitizedQuery.alias).toEqual({ field_a: 'testField' });
	});
});
