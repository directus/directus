import {
	ContainsNullValuesError,
	InvalidForeignKeyError,
	NotNullViolationError,
	RecordNotUniqueError,
	ValueOutOfRangeError,
	ValueTooLongError,
} from '@directus/errors';
import type { PostgresError } from './types.js';

enum PostgresErrorCodes {
	FOREIGN_KEY_VIOLATION = '23503',
	NOT_NULL_VIOLATION = '23502',
	NUMERIC_VALUE_OUT_OF_RANGE = '22003',
	UNIQUE_VIOLATION = '23505',
	VALUE_LIMIT_VIOLATION = '22001',
}

export function extractError(error: PostgresError): PostgresError | Error {
	switch (error.code) {
		case PostgresErrorCodes.UNIQUE_VIOLATION:
			return uniqueViolation(error);
		case PostgresErrorCodes.NUMERIC_VALUE_OUT_OF_RANGE:
			return numericValueOutOfRange(error);
		case PostgresErrorCodes.VALUE_LIMIT_VIOLATION:
			return valueLimitViolation(error);
		case PostgresErrorCodes.NOT_NULL_VIOLATION:
			return notNullViolation(error);
		case PostgresErrorCodes.FOREIGN_KEY_VIOLATION:
			return foreignKeyViolation(error);
		default:
			return error;
	}
}

function uniqueViolation(error: PostgresError) {
	const { table, detail } = error;

	const betweenParens = /\(([^)]+)\)/g;
	const matches = detail.match(betweenParens);

	if (!matches) return error;

	const collection = table;
	const field = matches[0].slice(1, -1);

	return new RecordNotUniqueError({
		collection,
		field,
	});
}

function numericValueOutOfRange(error: PostgresError) {
	const regex = /"(.*?)"/g;
	const matches = error.message.match(regex);

	if (!matches) return error;

	const collection = matches[0].slice(1, -1);
	const field = null;

	return new ValueOutOfRangeError({
		collection,
		field,
	});
}

function valueLimitViolation(error: PostgresError) {
	/**
	 * NOTE:
	 * Postgres doesn't return the offending column
	 */

	const regex = /"(.*?)"/g;
	const matches = error.message.match(regex);

	if (!matches) return error;

	const collection = matches[0].slice(1, -1);
	const field = null;

	return new ValueTooLongError({
		collection,
		field,
	});
}

function notNullViolation(error: PostgresError) {
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

function foreignKeyViolation(error: PostgresError) {
	const { table, detail } = error;

	const betweenParens = /\(([^)]+)\)/g;
	const matches = detail.match(betweenParens);

	if (!matches) return error;

	const collection = table;
	const field = matches[0].slice(1, -1);

	return new InvalidForeignKeyError({
		collection,
		field,
	});
}
