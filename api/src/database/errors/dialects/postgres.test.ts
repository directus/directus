import { ValueOutOfRangeError } from '@directus/errors';
import { describe, expect, test } from 'vitest';
import { extractError } from './postgres.js';
import type { PostgresError } from './types.js';

function buildError(overrides: Partial<PostgresError>): PostgresError {
	return {
		message: 'numeric field overflow',
		length: 0,
		code: '22003',
		detail: '',
		schema: 'public',
		table: '',
		...overrides,
	};
}

describe('extractError', () => {
	describe('numeric value out of range', () => {
		test('returns ValueOutOfRangeError with null field when table is known', () => {
			// Regression test for https://github.com/directus/directus/issues/25867.
			// Previously, parsing quotes out of the knex-prefixed error message could
			// pick up an unrelated column from the INSERT column list, reporting the
			// wrong field to the user.
			const error = buildError({
				// knex typically prefixes the query text to the error message, which
				// used to be parsed for the field name.
				message:
					'insert into "test_collection" ("other_field", "decimal_field") values ($1, $2) returning "id" - numeric field overflow',
				table: 'test_collection',
			});

			const result = extractError(error, { other_field: 'foo', decimal_field: 999999 });

			expect(result).toBeInstanceOf(ValueOutOfRangeError);

			expect((result as InstanceType<typeof ValueOutOfRangeError>).extensions).toEqual({
				collection: 'test_collection',
				field: null,
				value: null,
			});
		});

		test('falls through to the raw error when table is missing', () => {
			const error = buildError({
				message: 'numeric field overflow',
				table: '',
			});

			const result = extractError(error, {});

			expect(result).toBe(error);
		});
	});
});
