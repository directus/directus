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

describe('alias validation', async () => {
	const { validateQuery } = await import('./validate-query.js');

	test('accepts plain field alias', () => {
		expect(() => validateQuery({ alias: { myAlias: 'some_field' } })).not.toThrow();
	});

	test('accepts valid json() function in alias value', () => {
		expect(() => validateQuery({ alias: { myAlias: 'json(metadata, color)' } })).not.toThrow();
	});

	test('accepts json() with dot path in alias value', () => {
		expect(() => validateQuery({ alias: { myAlias: 'json(metadata, settings.theme)' } })).not.toThrow();
	});

	test('accepts json() with relational path in alias value', () => {
		expect(() => validateQuery({ alias: { myAlias: 'json(category_id.metadata, color)' } })).not.toThrow();
	});

	test('rejects alias value with dot (non-json)', () => {
		expect(() => validateQuery({ alias: { myAlias: 'relation.field' } })).toThrow(
			`"alias" value can't contain a period`,
		);
	});

	test('rejects alias key with dot', () => {
		expect(() => validateQuery({ alias: { 'my.alias': 'field' } })).toThrow(`"alias" key can't contain a period`);
	});

	test('rejects malformed json() syntax in alias value — missing comma', () => {
		expect(() => validateQuery({ alias: { myAlias: 'json(metadata)' } })).toThrow('Invalid json() syntax');
	});

	test('rejects malformed json() syntax in alias value — missing field', () => {
		expect(() => validateQuery({ alias: { myAlias: 'json(, color)' } })).toThrow('Invalid json() syntax');
	});

	test('rejects malformed json() syntax in alias value — missing path', () => {
		expect(() => validateQuery({ alias: { myAlias: 'json(metadata,)' } })).toThrow('Invalid json() syntax');
	});
});

describe('alias relational depth', async () => {
	vi.mocked(useEnv).mockReturnValue({ MAX_RELATIONAL_DEPTH: 2 });
	const { validateQuery } = await import('./validate-query.js');

	test('checks depth against resolved alias value, not key', () => {
		// alias key "myAlias" has depth 1, but the value resolves to depth 2 (category_id + metadata)
		expect(() =>
			validateQuery({
				fields: ['myAlias'],
				alias: { myAlias: 'json(category_id.metadata, color)' },
			}),
		).not.toThrow();
	});

	test('rejects alias that resolves beyond max relational depth', () => {
		// depth 3: a.b.c
		expect(() =>
			validateQuery({
				fields: ['myAlias'],
				alias: { myAlias: 'json(a.b.field, path)' },
			}),
		).toThrow('Max relational depth exceeded');
	});
});

describe('sort validation', async () => {
	const { validateQuery } = await import('./validate-query.js');

	test('accepts plain field in sort', () => {
		expect(() => validateQuery({ sort: ['title'] })).not.toThrow();
	});

	test('accepts plain field with leading dash in sort', () => {
		expect(() => validateQuery({ sort: ['-title'] })).not.toThrow();
	});

	test('accepts valid json() in sort', () => {
		expect(() => validateQuery({ sort: ['json(metadata, color)'] })).not.toThrow();
	});

	test('accepts valid json() with leading dash in sort', () => {
		expect(() => validateQuery({ sort: ['-json(metadata, color)'] })).not.toThrow();
	});

	test('accepts json() with dotted path in sort', () => {
		expect(() => validateQuery({ sort: ['json(metadata, settings.theme)'] })).not.toThrow();
	});

	test('accepts multiple sort fields including json()', () => {
		expect(() => validateQuery({ sort: ['title', 'json(metadata, color)', '-date_created'] })).not.toThrow();
	});

	test('accepts multiple json() sort fields', () => {
		expect(() => validateQuery({ sort: ['json(metadata, color)', '-json(metadata, priority)'] })).not.toThrow();
	});

	test('rejects malformed json() among otherwise valid sort fields', () => {
		expect(() => validateQuery({ sort: ['title', 'json(metadata)', '-date_created'] })).toThrow(
			'Invalid json() syntax',
		);
	});

	test('rejects malformed json() in sort — missing comma', () => {
		expect(() => validateQuery({ sort: ['json(metadata)'] })).toThrow('Invalid json() syntax');
	});

	test('rejects malformed json() in sort — missing field', () => {
		expect(() => validateQuery({ sort: ['json(, color)'] })).toThrow('Invalid json() syntax');
	});

	test('rejects malformed json() in sort — missing path', () => {
		expect(() => validateQuery({ sort: ['json(metadata,)'] })).toThrow('Invalid json() syntax');
	});

	test('rejects malformed json() with leading dash in sort', () => {
		expect(() => validateQuery({ sort: ['-json(metadata)'] })).toThrow('Invalid json() syntax');
	});
});

describe('sort relational depth', async () => {
	vi.mocked(useEnv).mockReturnValue({ MAX_RELATIONAL_DEPTH: 2 });
	const { validateQuery } = await import('./validate-query.js');

	test('dotted json path in sort does not inflate relational depth', () => {
		// json(metadata, path.with.dots) has relational depth 1 — dots inside json path are not relational segments
		expect(() =>
			validateQuery({
				sort: ['json(metadata, path.with.dots)'],
			}),
		).not.toThrow();
	});

	test('sort field exceeding max relational depth throws', () => {
		// a.b.c has relational depth 3 > 2
		expect(() =>
			validateQuery({
				sort: ['a.b.c'],
			}),
		).toThrow('Max relational depth exceeded');
	});

	test('sort resolves through alias before checking depth', () => {
		// alias key has depth 1, resolved value has depth 3 → should throw
		expect(() =>
			validateQuery({
				sort: ['mySort'],
				alias: { mySort: 'json(a.b.field, path)' },
			}),
		).toThrow('Max relational depth exceeded');
	});

	test('sort with leading dash strips prefix before alias lookup', () => {
		// -mySort resolves via alias to depth 1 → should not throw
		expect(() =>
			validateQuery({
				sort: ['-mySort'],
				alias: { mySort: 'json(metadata, color)' },
			}),
		).not.toThrow();
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

		test('throws when _in inside _json receives a string instead of an array', () => {
			expect(() => validateQuery(withJson({ color: { _in: 'red' } }) as any)).toThrowError(
				'"_in" has to be an array of values',
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

		describe('invalid path syntax', () => {
			test.each([
				['recursive descent', 'settings..theme'],
				['wildcard', 'items.*'],
				['filter expression', 'items[?(@.price)]'],
				['script expression', 'items[(@.length-1)]'],
				['root identifier', '$.color'],
				['current node', '@.color'],
				['negative array index', 'items[-1]'],
				['empty brackets', 'items[]'],
				['single quote (SQL injection)', "color'--"],
			])('throws for %s path "%s"', (_label, path) => {
				expect(() => validateQuery(withJson({ [path]: { _eq: 'x' } }) as any)).toThrowError(
					'Invalid JSON path: unsupported path expression',
				);
			});
		});
	});

	describe('valid path syntax', () => {
		test.each([
			['array index', 'items[0]'],
			['nested dot-path with index', 'settings.items[2].color'],
			['unicode letter path', 'données'],
		])('accepts %s path "%s"', (_label, path) => {
			expect(() => validateQuery(withJson({ [path]: { _eq: 'x' } }) as any)).not.toThrowError();
		});
	});
});
