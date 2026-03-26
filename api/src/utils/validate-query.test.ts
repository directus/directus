import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@directus/env');

beforeEach(() => {
	vi.resetModules();

	vi.mocked(useEnv).mockReturnValue({});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('max limit', () => {
	describe('max limit of 100', async () => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_LIMIT_MAX: 100 });
		const { validateQuery } = await import('./validate-query.js');

		test.each([-1, 1, 25])('should accept number %i', (limit) => {
			expect(() => validateQuery({ limit })).not.toThrowError('limit');
		});

		test('should error with 101', () => {
			expect(() => validateQuery({ limit: 101 })).toThrowError('limit');
		});
	});

	test('should accept 101 when no limit defined', async () => {
		const { validateQuery } = await import('./validate-query.js');

		expect(() => validateQuery({ limit: 101 })).not.toThrowError('limit');
	});

	test('should accept 101 when unlimited', async () => {
		vi.mocked(useEnv).mockReturnValue({ QUERY_LIMIT_MAX: -1 });
		const { validateQuery } = await import('./validate-query.js');

		expect(() => validateQuery({ limit: 101 })).not.toThrowError('limit');
	});
});

describe('export', async () => {
	const { validateQuery } = await import('./validate-query.js');

	test.each(['csv', 'csv_utf8', 'json', 'xml', 'yaml'])('should accept format %i', (format) => {
		expect(() => validateQuery({ export: format } as any)).not.toThrowError();
	});

	test('should error with invalid formats', () => {
		expect(() => validateQuery({ export: 'invalid-format' } as any)).toThrowError('"export" must be one of');
		expect(() => validateQuery({ export: 'csv_invalid' } as any)).toThrowError('"export" must be one of');
	});
});

describe('validateBoolean', async () => {
	const { validateBoolean } = await import('./validate-query.js');

	test.each([true, '', null, false])('should allow value %s', (value: unknown) => {
		expect(() => validateBoolean(value, 'test')).not.toThrowError();
	});

	test.each([undefined, 'wrong'])('should fail on value %s', (value: unknown) => {
		expect(() => validateBoolean(value, 'test')).toThrowError('"test" has to be a boolean');
	});
});

describe('validateGeometry', async () => {
	const { validateGeometry } = await import('./validate-query.js');

	test.each([
		'',
		null,
		{
			type: 'Point',
			coordinates: [30.0, 10.0],
		},
	])('should allow value %s', (value: unknown) => {
		expect(() => validateGeometry(value, 'test')).not.toThrowError();
	});

	test.each([undefined, 'wrong', {}])('should fail on value %s', (value: unknown) => {
		expect(() => validateGeometry(value, 'test')).toThrowError('"test" has to be a valid GeoJSON object');
	});
});

describe('validateJsonFilter (via validateQuery)', async () => {
	const { validateQuery } = await import('./validate-query.js');

	// Helpers to wrap a _json value in a minimal query filter
	const withJson = (jsonValue: unknown) => ({ filter: { metadata: { _json: jsonValue } } });

	describe('valid _json filter values', () => {
		test('accepts a simple _eq condition', () => {
			expect(() => validateQuery(withJson({ color: { _eq: 'red' } }) as any)).not.toThrowError();
		});

		test('accepts a _null boolean condition', () => {
			expect(() => validateQuery(withJson({ brand: { _null: true } }) as any)).not.toThrowError();
		});

		test('accepts a _nnull boolean condition', () => {
			expect(() => validateQuery(withJson({ brand: { _nnull: true } }) as any)).not.toThrowError();
		});

		test('accepts a _in array condition', () => {
			expect(() => validateQuery(withJson({ color: { _in: ['red', 'blue'] } }) as any)).not.toThrowError();
		});

		test('accepts a _between array condition', () => {
			expect(() => validateQuery(withJson({ level: { _between: [1, 5] } }) as any)).not.toThrowError();
		});

		test('accepts a nested dot-path key', () => {
			expect(() => validateQuery(withJson({ 'settings.theme': { _eq: 'dark' } }) as any)).not.toThrowError();
		});

		test('accepts _or as an array of sub-filter objects', () => {
			expect(() =>
				validateQuery(withJson({ _or: [{ color: { _eq: 'red' } }, { color: { _eq: 'blue' } }] }) as any),
			).not.toThrowError();
		});

		test('accepts _and as an array of sub-filter objects', () => {
			expect(() =>
				validateQuery(withJson({ _and: [{ color: { _eq: 'red' } }, { brand: { _eq: 'BrandX' } }] }) as any),
			).not.toThrowError();
		});

		test('accepts _or containing a nested _and', () => {
			expect(() =>
				validateQuery(
					withJson({
						_or: [{ _and: [{ color: { _eq: 'red' } }, { level: { _lt: 5 } }] }, { brand: { _eq: 'BrandY' } }],
					}) as any,
				),
			).not.toThrowError();
		});

		test('accepts multiple path conditions in one object (implicit AND)', () => {
			expect(() =>
				validateQuery(withJson({ color: { _eq: 'red' }, brand: { _nnull: true } }) as any),
			).not.toThrowError();
		});
	});

	describe('invalid _json filter values', () => {
		test('throws when _json value is null', () => {
			expect(() => validateQuery(withJson(null) as any)).toThrowError('"_json" filter value must be an object');
		});

		test('throws when _json value is a string', () => {
			expect(() => validateQuery(withJson('not-an-object') as any)).toThrowError(
				'"_json" filter value must be an object',
			);
		});

		test('throws when _json value is an array', () => {
			expect(() => validateQuery(withJson([{ color: { _eq: 'red' } }]) as any)).toThrowError(
				'"_json" filter value must be an object',
			);
		});

		test('throws when _json value is a number', () => {
			expect(() => validateQuery(withJson(42) as any)).toThrowError('"_json" filter value must be an object');
		});

		test('throws when _or inside _json is not an array', () => {
			expect(() => validateQuery(withJson({ _or: { color: { _eq: 'red' } } }) as any)).toThrowError(
				'"_json" logical operator "_or" must be an array',
			);
		});

		test('throws when _and inside _json is not an array', () => {
			expect(() => validateQuery(withJson({ _and: { color: { _eq: 'red' } } }) as any)).toThrowError(
				'"_json" logical operator "_and" must be an array',
			);
		});

		test('throws when _or inside _json contains a null entry', () => {
			expect(() => validateQuery(withJson({ _or: [null] }) as any)).toThrowError(
				'"_json" filter value must be an object',
			);
		});

		test('throws when inner filter for a path key is a primitive (string)', () => {
			expect(() => validateQuery(withJson({ color: 'not-an-object' }) as any)).toThrowError(
				'"_json" inner filter for path "color" must be an object',
			);
		});

		test('throws when inner filter for a path key is a number', () => {
			expect(() => validateQuery(withJson({ level: 5 }) as any)).toThrowError(
				'"_json" inner filter for path "level" must be an object',
			);
		});

		test('throws when _eq inside _json receives an empty string', () => {
			expect(() => validateQuery(withJson({ color: { _eq: '' } }) as any)).toThrowError(
				`You can't filter for an empty string`,
			);
		});

		test('throws when _in inside _json receives an empty array', () => {
			expect(() => validateQuery(withJson({ color: { _in: [] } }) as any)).toThrowError(
				'"_in" has to be an array of values',
			);
		});

		test('throws when _nin inside _json receives an empty array', () => {
			expect(() => validateQuery(withJson({ color: { _nin: [] } }) as any)).toThrowError(
				'"_nin" has to be an array of values',
			);
		});

		test('throws when _between inside _json receives a non-array', () => {
			expect(() => validateQuery(withJson({ level: { _between: 5 } }) as any)).toThrowError(
				'"_between" has to be an array of values',
			);
		});

		test('throws when _between inside _json receives an empty array', () => {
			expect(() => validateQuery(withJson({ level: { _between: [] } }) as any)).toThrowError(
				'"_between" has to be an array of values',
			);
		});

		test('throws when _null inside _json receives a non-boolean', () => {
			expect(() => validateQuery(withJson({ color: { _null: 'yes' } }) as any)).toThrowError(
				'"_null" has to be a boolean',
			);
		});

		test('throws when _nnull inside _json receives a non-boolean', () => {
			expect(() => validateQuery(withJson({ color: { _nnull: 'yes' } }) as any)).toThrowError(
				'"_nnull" has to be a boolean',
			);
		});

		test('throws when a json path key is nested inside another json path key', () => {
			expect(() => validateQuery(withJson({ 'a.b': { 'c[0]': { _eq: 1 } } }) as any)).toThrowError(
				'"_json" path "a.b" cannot contain a nested path "c[0]"; use a single flat path like "a.b.c[0]"',
			);
		});

		test('throws when a simple nested path is used instead of a flat path', () => {
			expect(() => validateQuery(withJson({ color: { theme: { _eq: 'red' } } }) as any)).toThrowError(
				'"_json" path "color" cannot contain a nested path "theme"; use a single flat path like "color.theme"',
			);
		});
	});
});
