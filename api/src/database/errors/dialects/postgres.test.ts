import { ValueTooLongError } from '@directus/errors';
import { describe, expect, it } from 'vitest';
import { extractError } from './postgres.js';
import type { PostgresError } from './types.js';

describe('postgres error extractor', () => {
	describe('22001 value limit violation', () => {
		it('returns ValueTooLongError with collection from error.table and no field', () => {
			// Postgres does not populate error.column for 22001 errors. Regression test for
			// directus/directus#26197 — previously the extractor guessed the field by parsing the
			// SQL string, which surfaced the first column in the INSERT rather than the offending one.
			const error: PostgresError = {
				message:
					'insert into "article" ("subtitle", "title") values ($1, $2) returning "id" - value too long for type character varying(10)',
				length: 0,
				code: '22001',
				detail: '',
				schema: 'public',
				table: 'article',
			};

			const result = extractError(error, { subtitle: 'short', title: 'way too long value' });

			expect(result).toBeInstanceOf(ValueTooLongError);
			const extensions = (result as any).extensions;
			expect(extensions.collection).toBe('article');
			expect(extensions.field).toBeNull();
			expect(extensions.value).toBeNull();
		});

		it('returns ValueTooLongError with null collection when table is not set', () => {
			const error: PostgresError = {
				message: 'value too long for type character varying(10)',
				length: 0,
				code: '22001',
				detail: '',
				schema: 'public',
				table: undefined as unknown as string,
			};

			const result = extractError(error, {});

			expect(result).toBeInstanceOf(ValueTooLongError);
			const extensions = (result as any).extensions;
			expect(extensions.collection).toBeNull();
			expect(extensions.field).toBeNull();
		});
	});
});
