import { InvalidForeignKeyException } from '../invalid-foreign-key';
import { NotNullViolationException } from '../not-null-violation';
import { RecordNotUniqueException } from '../record-not-unique';
import { ValueTooLongException } from '../value-too-long';
import { ValueOutOfRangeException } from '../value-out-of-range';

type MSSQLError = {
	message: string;
	code: 'EREQUEST';
	number: number;
	state: number;
	class: number;
	serverName: string;
	procName: string;
	lineNumber: number;
};

enum MSSQLErrorCodes {
	FOREIGN_KEY_VIOLATION = 547,
	NOT_NULL_VIOLATION = 515,
	NUMERIC_VALUE_OUT_OF_RANGE = 220,
	UNIQUE_VIOLATION = 2601,
	VALUE_LIMIT_VIOLATION = 2628,
}

export function extractError(error: MSSQLError) {
	switch (error.number) {
		case MSSQLErrorCodes.UNIQUE_VIOLATION:
			return uniqueViolation(error);
		case MSSQLErrorCodes.NUMERIC_VALUE_OUT_OF_RANGE:
			return numericValueOutOfRange(error);
		case MSSQLErrorCodes.VALUE_LIMIT_VIOLATION:
			return valueLimitViolation(error);
		case MSSQLErrorCodes.NOT_NULL_VIOLATION:
			return notNullViolation(error);
		case MSSQLErrorCodes.FOREIGN_KEY_VIOLATION:
			return foreignKeyViolation(error);
	}

	return error;
}

function uniqueViolation(error: MSSQLError) {
	const betweenBrackets = /\[([^\]]+)\]/g;
	const betweenParens = /\(([^\)]+)\)/g;

	const bracketMatches = error.message.match(betweenBrackets);
	const parenMatches = error.message.match(betweenParens);

	if (!bracketMatches || !parenMatches) return error;

	const collection = bracketMatches[0].slice(1, -1);
	const field = bracketMatches[1].slice(1, -1);
	const invalid = parenMatches[parenMatches.length - 1].slice(1, -1);

	return new RecordNotUniqueException(field, {
		collection,
		field,
		invalid,
	});
}

function numericValueOutOfRange(error: MSSQLError) {
	const betweenBrackets = /\[([^\]]+)\]/g;

	const bracketMatches = error.message.match(betweenBrackets);

	if (!bracketMatches) return error;

	const collection = bracketMatches[0].slice(1, -1);
	const field = bracketMatches[1].slice(1, -1);

	const parts = error.message.split(' ');
	const invalid = parts[parts.length - 1].slice(0, -1);

	return new ValueOutOfRangeException(field, {
		collection,
		field,
		invalid,
	});
}

function valueLimitViolation(error: MSSQLError) {
	const betweenBrackets = /\[([^\]]+)\]/g;

	const bracketMatches = error.message.match(betweenBrackets);

	if (!bracketMatches) return error;

	const collection = bracketMatches[0].slice(1, -1);
	const field = bracketMatches[1].slice(1, -1);

	return new ValueTooLongException(field, {
		collection,
		field,
	});
}

function notNullViolation(error: MSSQLError) {
	const betweenBrackets = /\[([^\]]+)\]/g;
	const betweenQuotes = /\'([^\']+)\'/g;

	const bracketMatches = error.message.match(betweenBrackets);
	const quoteMatches = error.message.match(betweenQuotes);

	if (!bracketMatches || !quoteMatches) return error;

	const collection = bracketMatches[0].slice(1, -1);
	const field = quoteMatches[0].slice(1, -1);

	return new NotNullViolationException(field, {
		collection,
		field,
	});
}

function foreignKeyViolation(error: MSSQLError) {
	console.log(error);
	return error;
}

/**
 * @TODO don't rely on brackets, as the order can't be guaranteed
 */
