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

enum Errors {
	FOREIGN_KEY_VIOLATION = '23503',
	NOT_NULL_VIOLATION = '23502',
	NUMERIC_VALUE_OUT_OF_RANGE = '22003',
	UNIQUE_VIOLATION = '23505',
	VALUE_LIMIT_VIOLATION = '22001',
}

export function extractError(error: PostgresError) {
	switch (error.code) {
		case Errors.UNIQUE_VIOLATION:
			return uniqueViolation(error);
		case Errors.NUMERIC_VALUE_OUT_OF_RANGE:
			return numericValueOutOfRange(error);
		case Errors.VALUE_LIMIT_VIOLATION:
			return valueLimitViolation(error);
		case Errors.NOT_NULL_VIOLATION:
			return notNullViolation(error);
		case Errors.FOREIGN_KEY_VIOLATION:
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

	return new RecordNotUniqueException(`Field "${field}" has to be unique.`, {
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
	const field = matches[1].slice(1, -1);
	const invalid = matches[2].slice(1, -1);

	return new ValueOutOfRangeException(`Numeric value in field "${field}" is out of range.`, {
		collection,
		field,
		invalid,
	});
}

function valueLimitViolation(error: PostgresError) {
	const regex = /"(.*?)"/g;
	const matches = error.message.match(regex);

	if (!matches) return error;

	const collection = matches[0].slice(1, -1);
	const field = matches[1].slice(1, -1);

	return new ValueTooLongException(`Value for field "${field}" is too long.`, {
		collection,
		field,
	});
}

function notNullViolation(error: PostgresError) {
	const { table, column } = error;

	return new NotNullViolationException(`Value for field "${column}" can't be null.`, {
		collection: table,
		field: column!,
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

	return new InvalidForeignKeyException(`Invalid foreign key in field "${field}".`, {
		collection,
		field,
		invalid,
	});
}
