import { InvalidForeignKeyException } from '../invalid-foreign-key';
import { NotNullViolationException } from '../not-null-violation';
import { RecordNotUniqueException } from '../record-not-unique';
import { ValueTooLongException } from '../value-too-long';
import { ValueOutOfRangeException } from '../value-out-of-range';
import { MySQLError } from './types';

enum MySQLErrorCodes {
	UNIQUE_VIOLATION = 'ER_DUP_ENTRY',
	NUMERIC_VALUE_OUT_OF_RANGE = 'ER_WARN_DATA_OUT_OF_RANGE',
	ER_DATA_TOO_LONG = 'ER_DATA_TOO_LONG',
	NOT_NULL_VIOLATION = 'ER_BAD_NULL_ERROR',
	FOREIGN_KEY_VIOLATION = 'ER_NO_REFERENCED_ROW_2',
}

export function extractError(error: MySQLError): MySQLError | Error {
	switch (error.code) {
		case MySQLErrorCodes.UNIQUE_VIOLATION:
			return uniqueViolation(error);
		case MySQLErrorCodes.NUMERIC_VALUE_OUT_OF_RANGE:
			return numericValueOutOfRange(error);
		case MySQLErrorCodes.ER_DATA_TOO_LONG:
			return valueLimitViolation(error);
		case MySQLErrorCodes.NOT_NULL_VIOLATION:
			return notNullViolation(error);
		case MySQLErrorCodes.FOREIGN_KEY_VIOLATION:
			return foreignKeyViolation(error);
	}
	return error;
}

function uniqueViolation(error: MySQLError) {
	const betweenQuotes = /'([^']+)'/g;
	const matches = error.sqlMessage.match(betweenQuotes);

	if (!matches) return error;

	const collection = matches[1].slice(1, -1).split('.')[0];

	let field = null;

	/**
	 * MySQL's error doesn't return the field name in the error. In case the field is created through
	 * Directus (/ Knex), the key name will be `<collection>_<field>_unique` in which case we can pull
	 * the field name from the key name
	 */
	const indexName = matches[1].slice(1, -1).split('.')[1];

	if (indexName?.startsWith(`${collection}_`) && indexName.endsWith('_unique')) {
		field = indexName.slice(collection.length + 1, -7);
	}

	const invalid = matches[0].slice(1, -1);

	return new RecordNotUniqueException(field, {
		collection,
		field,
		invalid,
	});
}

function numericValueOutOfRange(error: MySQLError) {
	const betweenTicks = /`([^`]+)`/g;
	const betweenQuotes = /'([^']+)'/g;

	const tickMatches = error.sql.match(betweenTicks);
	const quoteMatches = error.sqlMessage.match(betweenQuotes);

	if (!tickMatches || !quoteMatches) return error;

	const collection = tickMatches[0].slice(1, -1);
	const field = quoteMatches[0].slice(1, -1);

	return new ValueOutOfRangeException(field, {
		collection,
		field,
	});
}

function valueLimitViolation(error: MySQLError) {
	const betweenTicks = /`([^`]+)`/g;
	const betweenQuotes = /'([^']+)'/g;

	const tickMatches = error.sql.match(betweenTicks);
	const quoteMatches = error.sqlMessage.match(betweenQuotes);

	if (!tickMatches || !quoteMatches) return error;

	const collection = tickMatches[0].slice(1, -1);
	const field = quoteMatches[0].slice(1, -1);

	return new ValueTooLongException(field, {
		collection,
		field,
	});
}

function notNullViolation(error: MySQLError) {
	const betweenTicks = /`([^`]+)`/g;
	const betweenQuotes = /'([^']+)'/g;

	const tickMatches = error.sql.match(betweenTicks);
	const quoteMatches = error.sqlMessage.match(betweenQuotes);

	if (!tickMatches || !quoteMatches) return error;

	const collection = tickMatches[0].slice(1, -1);
	const field = quoteMatches[0].slice(1, -1);

	return new NotNullViolationException(field, {
		collection,
		field,
	});
}

function foreignKeyViolation(error: MySQLError) {
	const betweenTicks = /`([^`]+)`/g;
	const betweenParens = /\(([^)]+)\)/g;

	const tickMatches = error.sqlMessage.match(betweenTicks);
	const parenMatches = error.sql.match(betweenParens);

	if (!tickMatches || !parenMatches) return error;

	const collection = tickMatches[1].slice(1, -1);
	const field = tickMatches[3].slice(1, -1);
	const invalid = parenMatches[1].slice(1, -1);

	return new InvalidForeignKeyException(field, {
		collection,
		field,
		invalid,
	});
}
