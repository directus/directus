import { ErrorCode, isDirectusError } from '@directus/errors';
import { describe, expect, test } from 'vitest';
import { extractError } from './oracle.js';
import type { OracleError } from './types.js';

describe('oracle extractError', () => {
	test('translates a foreign key violation (ORA-02291) into an InvalidForeignKeyError with the constraint name', () => {
		const error = {
			errorNum: 2291,
			offset: 0,
			message: 'ORA-02291: integrity constraint (DIRECTUS.ARTICLES_AUTHOR_FOREIGN) violated - parent key not found',
		} satisfies OracleError;

		const result = extractError(error);

		expect(isDirectusError(result, ErrorCode.InvalidForeignKey)).toBe(true);
		expect((result as any).extensions).toMatchObject({ constraint: 'ARTICLES_AUTHOR_FOREIGN' });
	});

	test('passes through unknown errors untouched', () => {
		const error = { errorNum: 1, offset: 0, message: 'ORA-00001: unique constraint violated' } satisfies OracleError;

		expect(extractError(error)).toBe(error);
	});
});
