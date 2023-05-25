import { beforeEach, describe, expect, test, vi } from 'vitest';
import env from '../env.js';

const getValidateQuery = async (mockedEnv?: { [k: string]: any }) => {
	vi.doMock('../env', async () => {
		return {
			default: {
				...env,
				...mockedEnv,
			},
		};
	});

	return (await import('./validate-query.js')).validateQuery;
};

beforeEach(() => {
	vi.resetModules();
});

describe('max limit', () => {
	describe('max limit of 100', async () => {
		const validateQuery = await getValidateQuery({ QUERY_LIMIT_MAX: 100 });

		test.each([-1, 1, 25])('should accept number %i', (limit) => {
			expect(() => validateQuery({ limit })).not.toThrowError('limit');
		});

		test('should error with 101', () => {
			expect(() => validateQuery({ limit: 101 })).toThrowError('limit');
		});
	});

	test('should accept 101 when no limit defined', async () => {
		const validateQuery = await getValidateQuery();

		expect(() => validateQuery({ limit: 101 })).not.toThrowError('limit');
	});

	test('should accept 101 when unlimited', async () => {
		const validateQuery = await getValidateQuery({ QUERY_LIMIT_MAX: -1 });

		expect(() => validateQuery({ limit: 101 })).not.toThrowError('limit');
	});
});

describe('export', async () => {
	const validateQuery = await getValidateQuery();

	test.each(['csv', 'json', 'xml', 'yaml'])('should accept format %i', (format) => {
		expect(() => validateQuery({ export: format } as any)).not.toThrowError();
	});

	test('should error with invalid-format', () => {
		expect(() => validateQuery({ export: 'invalid-format' } as any)).toThrowError('"export" must be one of');
	});
});
