import { ErrorCode, isDirectusError } from '@directus/errors';
import { describe, expect, test, vi } from 'vitest';
import { extractError } from './mssql.js';
import type { MSSQLError } from './types.js';

vi.mock('../../index.js', () => ({ default: vi.fn() }));

const baseError = {
	code: 'EREQUEST',
	state: 0,
	class: 16,
	serverName: 'server',
	procName: '',
	lineNumber: 1,
} satisfies Omit<MSSQLError, 'number' | 'message'>;

describe('mssql extractError', () => {
	test('translates a foreign key violation (547) into an InvalidForeignKeyError with the constraint name', async () => {
		const error = {
			...baseError,
			number: 547,
			message:
				'The INSERT statement conflicted with the FOREIGN KEY constraint "articles_author_foreign". The conflict occurred in database "directus", table "dbo.authors", column \'id\'.',
		} satisfies MSSQLError;

		const result = await extractError(error, { title: 'Orphan', author: 999 });

		expect(isDirectusError(result, ErrorCode.InvalidForeignKey)).toBe(true);
		expect((result as any).extensions).toMatchObject({ constraint: 'articles_author_foreign' });
	});

	test('passes through unknown errors untouched', async () => {
		const error = { ...baseError, number: 1, message: 'Some other error' } satisfies MSSQLError;

		expect(await extractError(error, {})).toBe(error);
	});
});
