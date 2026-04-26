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
		// Use structured fields from the Postgres error object. Regex-based extraction
		// from error.message is unreliable: when Knex prepends the SQL query to the
		// message, the regex matches the first column in the INSERT rather than the
		// column that actually overflowed, producing a misleading error.
		const collection = error.table;

		if (!collection) return error;

		const field = error.column ?? null;

		return new ValueOutOfRangeError({
			collection,
			field,
			value: field ? data[field] : null,
		});
	}

	function valueLimitViolation() {
		// Use structured fields from the Postgres error object. Postgres includes
		// the column name in the error for 22001 (value too long) when the column
		// can be identified; older versions may not, in which case field will be null.
		const collection = error.table;

		if (!collection) return error;

		const field = error.column ?? null;

		return new ValueTooLongError({
			collection,
			field,
			value: field ? data[field] : null,
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
