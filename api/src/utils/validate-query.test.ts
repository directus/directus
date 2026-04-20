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

describe('validateFilter operators', async () => {
	const { validateQuery } = await import('./validate-query.js');

	test.each([
		{ filter: { _in: 'wrong' }, reason: '"_in" has to be an array of values' },
		{ filter: { _empty: 'wrong' }, reason: '"_empty" has to be a boolean' },
		{ filter: { _intersects: {} }, reason: '"_intersects" has to be a valid GeoJSON object' },
		{ filter: { _eq: '' }, reason: 'You can\'t filter for an empty string in "_eq"' },
	])('should validate filter operator %o', ({ filter, reason }) => {
		expect(() => validateQuery({ filter } as any)).toThrowError(reason);
	});
});
