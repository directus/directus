import { InvalidForeignKeyException } from '../invalid-foreign-key';
import { NotNullViolationException } from '../not-null-violation';
import { RecordNotUniqueException } from '../record-not-unique';
import { ValueTooLongException } from '../value-too-long';
import { ValueOutOfRangeException } from '../value-out-of-range';

type PostgresError = {
	message: string;
	length: number;
	code: string;
	detail: string;
	schema: string;
	table: string;
	column?: string;
	dataType?: string;
	constraint?: string;
};

enum PostgresErrorCodes {
	FOREIGN_KEY_VIOLATION = '23503',
	NOT_NULL_VIOLATION = '23502',
	NUMERIC_VALUE_OUT_OF_RANGE = '22003',
	UNIQUE_VIOLATION = '23505',
	VALUE_LIMIT_VIOLATION = '22001',
}

export function extractError(error: PostgresError) {
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

	const betweenParens = /\(([^\)]+)\)/g;
	const matches = detail.match(betweenParens);

	if (!matches) return error;

	const collection = table;
	const field = matches[0].slice(1, -1);
	const invalid = matches[1].slice(1, -1);

	return new RecordNotUniqueException(field, {
		collection,
		field,
		invalid,
	});
}

function numericValueOutOfRange(error: PostgresError) {
	const regex = /"(.*?)"/g;
	const matches = error.message.match(regex);

	if (!matches) return error;

	const collection = matches[0].slice(1, -1);
	const field = null;
	const invalid = matches[2].slice(1, -1);

	return new ValueOutOfRangeException(field, {
		collection,
		field,
		invalid,
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

	return new ValueTooLongException(field, {
		collection,
		field,
	});
}

function notNullViolation(error: PostgresError) {
	const { table, column } = error;

	if (!column) return error;

	return new NotNullViolationException(column, {
		collection: table,
		field: column,
	});
}

function foreignKeyViolation(error: PostgresError) {
	const { table, detail } = error;

	const betweenParens = /\(([^\)]+)\)/g;
	const matches = detail.match(betweenParens);

	if (!matches) return error;

	const collection = table;
	const field = matches[0].slice(1, -1);
	const invalid = matches[1].slice(1, -1);

	return new InvalidForeignKeyException(field, {
		collection,
		field,
		invalid,
	});
}
