import {
	ContainsNullValuesError,
	InvalidForeignKeyError,
	NotNullViolationError,
	RecordNotUniqueError,
	ValueOutOfRangeError,
	ValueTooLongError,
} from '@directus/errors';
import type { MySQLError } from './types.js';

enum MySQLErrorCodes {
	UNIQUE_VIOLATION = 'ER_DUP_ENTRY',
	NUMERIC_VALUE_OUT_OF_RANGE = 'ER_WARN_DATA_OUT_OF_RANGE',
	ER_DATA_TOO_LONG = 'ER_DATA_TOO_LONG',
	NOT_NULL_VIOLATION = 'ER_BAD_NULL_ERROR',
	FOREIGN_KEY_VIOLATION = 'ER_NO_REFERENCED_ROW_2',
	ER_INVALID_USE_OF_NULL = 'ER_INVALID_USE_OF_NULL',
	WARN_DATA_TRUNCATED = 'WARN_DATA_TRUNCATED',
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
		// Note: MariaDB throws data truncated for null value error
		case MySQLErrorCodes.ER_INVALID_USE_OF_NULL:
		case MySQLErrorCodes.WARN_DATA_TRUNCATED:
			return containsNullValues(error);
	}

	return error;
}

function uniqueViolation(error: MySQLError) {
	const betweenQuotes = /'([^']+)'/g;
	const matches = error.sqlMessage.match(betweenQuotes);

	if (!matches) return error;

	/**
	 * MySQL's error doesn't return the field name in the error. In case the field is created through
	 * Directus (/ Knex), the key name will be `<collection>_<field>_unique` in which case we can pull
	 * the field name from the key name
	 */

	/** MySQL 8+ style error message */
	if (matches[1]!.includes('.')) {
		const collection = matches[1]!.slice(1, -1).split('.')[0]!;

		let field = null;

		const indexName = matches[1]?.slice(1, -1).split('.')[1];

		if (indexName?.startsWith(`${collection}_`) && indexName.endsWith('_unique')) {
			field = indexName?.slice(collection.length + 1, -7);
		}

		return new RecordNotUniqueError({
			collection,
			field,
		});
	} else {
		/** MySQL 5.7 style error message */
		const indexName = matches[1]!.slice(1, -1);

		const collection = indexName.split('_')[0]!;

		let field = null;

		if (indexName?.startsWith(`${collection}_`) && indexName.endsWith('_unique')) {
			field = indexName?.slice(collection.length + 1, -7);
		}

		return new RecordNotUniqueError({
			collection,
			field,
		});
	}
}

function numericValueOutOfRange(error: MySQLError) {
	const betweenTicks = /`([^`]+)`/g;
	const betweenQuotes = /'([^']+)'/g;

	const tickMatches = error.sql.match(betweenTicks);
	const quoteMatches = error.sqlMessage.match(betweenQuotes);

	if (!tickMatches || !quoteMatches) return error;

	const collection = tickMatches[0]?.slice(1, -1);
	const field = quoteMatches[0]?.slice(1, -1);

	return new ValueOutOfRangeError({
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

	const collection = tickMatches[0]?.slice(1, -1);
	const field = quoteMatches[0]?.slice(1, -1);

	return new ValueTooLongError({
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

	const collection = tickMatches[0]?.slice(1, -1);
	const field = quoteMatches[0]?.slice(1, -1);

	return new NotNullViolationError({
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

	const collection = tickMatches[1]!.slice(1, -1)!;
	const field = tickMatches[3]!.slice(1, -1)!;

	return new InvalidForeignKeyError({
		collection,
		field,
	});
}

function containsNullValues(error: MySQLError) {
	const betweenTicks = /`([^`]+)`/g;

	// Normally, we shouldn't read from the executed SQL. In this case, we're altering a single
	// column, so we shouldn't have the problem where multiple columns are altered at the same time
	const tickMatches = error.sql.match(betweenTicks);

	if (!tickMatches) return error;

	const collection = tickMatches[0]!.slice(1, -1)!;
	const field = tickMatches[1]!.slice(1, -1)!;

	return new ContainsNullValuesError({ collection, field });
}
