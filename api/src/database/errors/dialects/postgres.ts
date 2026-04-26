import {
	ContainsNullValuesError,
	InvalidForeignKeyError,
	NotNullViolationError,
	RecordNotUniqueError,
	ValueOutOfRangeError,
	ValueTooLongError,
} from '@directus/errors';
import type { Item } from '@directus/types';
import type { PostgresError } from './types.js';

enum PostgresErrorCodes {
	FOREIGN_KEY_VIOLATION = '23503',
	NOT_NULL_VIOLATION = '23502',
	NUMERIC_VALUE_OUT_OF_RANGE = '22003',
	UNIQUE_VIOLATION = '23505',
	VALUE_LIMIT_VIOLATION = '22001',
}

export function extractError(error: PostgresError, data: Partial<Item>): PostgresError | Error {
	switch (error.code) {
		case PostgresErrorCodes.UNIQUE_VIOLATION:
			return uniqueViolation();
		case PostgresErrorCodes.NUMERIC_VALUE_OUT_OF_RANGE:
			return numericValueOutOfRange();
		case PostgresErrorCodes.VALUE_LIMIT_VIOLATION:
			return valueLimitViolation();
		case PostgresErrorCodes.NOT_NULL_VIOLATION:
			return notNullViolation();
		case PostgresErrorCodes.FOREIGN_KEY_VIOLATION:
			return foreignKeyViolation();
		default:
			return error;
	}

	function uniqueViolation() {
		const { table, detail } = error;

		const betweenParens = /\(([^)]+)\)/g;
		const matches = detail.match(betweenParens);

		if (!matches) return error;

		const collection = table;
		const field = matches[0].slice(1, -1);

		return new RecordNotUniqueError({
			collection,
			field,
			value: field ? data[field] : null,
		});
	}

	function numericValueOutOfRange() {
		/**
		 * NOTE:
		 * PostgreSQL error code 22003 does not reliably include the offending column in its
		 * message — it only contains a generic description like "integer out of range" or
		 * "numeric field overflow". Parsing quoted strings from `error.message` can return the
		 * table/first-column from a knex-prepended SQL statement instead of the actual violating
		 * column, producing a misleading error (see #25867).
		 *
		 * Use `error.table` (which PostgreSQL populates) for the collection, and `error.column`
		 * if the driver provides it, otherwise omit the field.
		 */
		const collection = error.table ?? null;
		const field = error.column ?? null;

		return new ValueOutOfRangeError({
			collection,
			field,
			value: field ? data[field] : null,
		});
	}

	function valueLimitViolation() {
		/**
		 * NOTE:
		 * PostgreSQL error code 22001 does not include the offending column in the structured error
		 * fields. The `error.message` only contains a generic type description such as
		 * "value too long for type character varying(255)" — it does NOT name the column.
		 *
		 * Previous code tried to extract collection/field by parsing quoted strings from
		 * `error.message`, but when knex prepends the SQL query to the message the regex
		 * incorrectly picks up the table name and the first listed column (which may not be the
		 * violating one), producing a misleading error.
		 *
		 * Use `error.table` for the collection (which PostgreSQL does populate) and omit the
		 * field, since its identity cannot be determined reliably from this error.
		 */
		const collection = error.table ?? null;

		return new ValueTooLongError({
			collection,
			field: null,
			value: null,
		});
	}

	function notNullViolation() {
		const { table, column } = error;
		if (!column) return error;

		if (error.message.endsWith('contains null values')) {
			return new ContainsNullValuesError({ collection: table, field: column });
		}

		return new NotNullViolationError({
			collection: table,
			field: column,
		});
	}

	function foreignKeyViolation() {
		const { table, detail } = error;

		const betweenParens = /\(([^)]+)\)/g;
		const matches = detail.match(betweenParens);

		if (!matches) return error;

		const collection = table;
		const field = matches[0].slice(1, -1);

		return new InvalidForeignKeyError({
			collection,
			field,
			value: field ? data[field] : null,
		});
	}
}
