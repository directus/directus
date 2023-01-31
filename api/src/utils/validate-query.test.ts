import { describe, expect, test, vi } from 'vitest';
import { validateQuery } from './validate-query';

vi.mock('../env', async () => {
	const actual = (await vi.importActual('../env')) as { default: Record<string, any> };
	const MOCK_ENV = {
		...actual.default,
		MAX_QUERY_LIMIT: 100,
	};
	return {
		default: MOCK_ENV,
		getEnv: () => MOCK_ENV,
	};
});

describe('max limit', () => {
	test.each([-1, 1, 25])('should accept number %i', (limit) => {
		expect(() => validateQuery({ limit })).not.toThrowError('limit');
	});

	test('should error with 101', () => {
		expect(() => validateQuery({ limit: 101 })).toThrowError('limit');
	});
});

describe('export', () => {
	test.each(['csv', 'json', 'xml', 'yaml'])('should accept format %i', (format) => {
		expect(() => validateQuery({ export: format } as any)).not.toThrowError();
	});

	test('should error with invalid-format', () => {
		expect(() => validateQuery({ export: 'invalid-format' } as any)).toThrowError('"export" must be one of');
	});
});
