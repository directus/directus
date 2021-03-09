import { InvalidForeignKeyException } from '../invalid-foreign-key';
import { NotNullViolationException } from '../not-null-violation';
import { RecordNotUniqueException } from '../record-not-unique';
import { ValueTooLongException } from '../value-too-long';
import { ValueOutOfRangeException } from '../value-out-of-range';

type MySQLError = {
	message: string;
	code: string;
	errno: number;
	sqlMessage: string;
	sqlState: string;
	index: number;
	sql: string;
};

enum MySQLErrorCodes {
	ER_DUP_ENTRY = 'ER_DUP_ENTRY',
	ER_WARN_DATA_OUT_OF_RANGE = 'ER_WARN_DATA_OUT_OF_RANGE',
	ER_DATA_TOO_LONG = 'ER_DATA_TOO_LONG',
	ER_BAD_NULL_ERROR = 'ER_BAD_NULL_ERROR',
	ER_NO_REFERENCED_ROW_2 = 'ER_NO_REFERENCED_ROW_2',
}

export function extractError(error: MySQLError) {
	switch (error.code) {
		case MySQLErrorCodes.ER_DUP_ENTRY:
			return uniqueViolation(error);
		case MySQLErrorCodes.ER_WARN_DATA_OUT_OF_RANGE:
			return numericValueOutOfRange(error);
		case MySQLErrorCodes.ER_DATA_TOO_LONG:
			return valueLimitViolation(error);
		case MySQLErrorCodes.ER_BAD_NULL_ERROR:
			return notNullViolation(error);
		case MySQLErrorCodes.ER_NO_REFERENCED_ROW_2:
			return foreignKeyViolation(error);
	}
	return error;
}

function uniqueViolation(error: MySQLError) {
	const betweenQuotes = /\'([^\']+)\'/g;
	const matches = error.sqlMessage.match(betweenQuotes);

	if (!matches) return error;

	const collection = matches[1].slice(1, -1).split('.')[0];
	const field = matches[1].slice(1, -1).split('.')[1];
	const invalid = matches[0].slice(1, -1);

	return new RecordNotUniqueException(field, {
		collection,
		field,
		invalid,
	});
}

function numericValueOutOfRange(error: MySQLError) {
	const betweenTicks = /\`([^\`]+)\`/g;
	const betweenParens = /\(([^\)]+)\)/g;

	const tickMatches = error.sql.match(betweenTicks);
	const parenMatches = error.sql.match(betweenParens);

	if (!tickMatches || !parenMatches) return error;

	const collection = tickMatches[0].slice(1, -1);
	const field = tickMatches[1].slice(1, -1);
	const invalid = parenMatches[1].slice(1, -1);

	return new ValueOutOfRangeException(field, {
		collection,
		field,
		invalid,
	});
}

function valueLimitViolation(error: MySQLError) {
	const betweenTicks = /\`([^\`]+)\`/g;

	const tickMatches = error.sql.match(betweenTicks);

	if (!tickMatches) return error;

	const collection = tickMatches[0].slice(1, -1);
	const field = tickMatches[1].slice(1, -1);

	return new ValueTooLongException(field, {
		collection,
		field,
	});
}

function notNullViolation(error: MySQLError) {
	const betweenTicks = /\`([^\`]+)\`/g;

	const tickMatches = error.sql.match(betweenTicks);

	if (!tickMatches) return error;

	const collection = tickMatches[0].slice(1, -1);
	const field = tickMatches[1].slice(1, -1);

	return new NotNullViolationException(field, {
		collection,
		field,
	});
}

function foreignKeyViolation(error: MySQLError) {
	const betweenTicks = /\`([^\`]+)\`/g;
	const betweenParens = /\(([^\)]+)\)/g;

	const tickMatches = error.sql.match(betweenTicks);
	const parenMatches = error.sql.match(betweenParens);

	if (!tickMatches || !parenMatches) return error;

	const collection = tickMatches[0].slice(1, -1);
	const field = tickMatches[1].slice(1, -1);
	const invalid = parenMatches[1].slice(1, -1);

	return new InvalidForeignKeyException(field, {
		collection,
		field,
		invalid,
	});
}
