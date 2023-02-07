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

describe('export', () => {
	test.each(['csv', 'json', 'xml', 'yaml'])('should accept format %i', (format) => {
		expect(() => validateQuery({ export: format } as any)).not.toThrowError();
	});

	test('should error with invalid-format', () => {
		expect(() => validateQuery({ export: 'invalid-format' } as any)).toThrowError('"export" must be one of');
	});
});
