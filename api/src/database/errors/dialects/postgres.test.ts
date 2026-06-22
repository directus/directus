import { ValueTooLongError } from '@directus/errors';
import { expect, test } from 'vitest';
import { extractError } from './postgres.js';
import type { PostgresError } from './types.js';

const valueTooLongError = {
	code: '22001',
	message:
		'insert into "services" ("client_id", "name") values ($1, $2) returning "id" - value too long for type character varying(255)',
	table: 'services',
} as PostgresError;

test('VALUE_TOO_LONG omits the field for multi-field inserts and reports it for single-field inserts', () => {
	// Postgres does not name the offending column for a 22001 error. With more
	// than one field in the payload it cannot be inferred, so it must not be
	// guessed from the SQL text (which previously mis-reported an unrelated
	// field). See #26197.
	const multiField = extractError(valueTooLongError, { client_id: 1570, name: 'x'.repeat(300) });
	expect(multiField).toBeInstanceOf(ValueTooLongError);

	const multiFieldExtensions = (multiField as InstanceType<typeof ValueTooLongError>).extensions;
	expect(multiFieldExtensions.collection).toBe('services');
	expect(multiFieldExtensions.field).toBe(null);
	expect(multiFieldExtensions.value).toBe(null);

	// With a single field the offending column is unambiguous.
	const singleField = extractError(valueTooLongError, { name: 'x'.repeat(300) });
	const singleFieldExtensions = (singleField as InstanceType<typeof ValueTooLongError>).extensions;
	expect(singleFieldExtensions.field).toBe('name');
	expect(singleFieldExtensions.value).toBe('x'.repeat(300));
});
