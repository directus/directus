import {
	ContainsNullValuesError,
	InvalidForeignKeyError,
	NotNullViolationError,
	RecordNotUniqueError,
	ValueOutOfRangeError,
	ValueTooLongError,
} from '@directus/errors';

import type { Item } from '@directus/types';
import getDatabase from '../../index.js';
import type { MSSQLError } from './types.js';

enum MSSQLErrorCodes {
	FOREIGN_KEY_VIOLATION = 547,
	NOT_NULL_VIOLATION = 515,
	NUMERIC_VALUE_OUT_OF_RANGE = 220,
	UNIQUE_VIOLATION_INDEX = 2601,
	UNIQUE_VIOLATION_CONSTRAINT = 2627,
	VALUE_LIMIT_VIOLATION = 2628,
}

export async function extractError(error: MSSQLError, data: Partial<Item>): Promise<MSSQLError | Error> {
	switch (error.number) {
		case MSSQLErrorCodes.UNIQUE_VIOLATION_CONSTRAINT:
		case MSSQLErrorCodes.UNIQUE_VIOLATION_INDEX:
			return await uniqueViolation(error);
		case MSSQLErrorCodes.NUMERIC_VALUE_OUT_OF_RANGE:
			return numericValueOutOfRange();
		case MSSQLErrorCodes.VALUE_LIMIT_VIOLATION:
			return valueLimitViolation();
		case MSSQLErrorCodes.NOT_NULL_VIOLATION:
			return notNullViolation();
		case MSSQLErrorCodes.FOREIGN_KEY_VIOLATION:
			return foreignKeyViolation();
	}

	return error;

	async function uniqueViolation(error: MSSQLError) {
		/**
		 * NOTE:
		 * SQL Server doesn't return the name of the offending column when a unique error is thrown:
		 *
		 * Constraint:
		 * insert into [articles] ([unique]) values (@p0)
		 * - Violation of UNIQUE KEY constraint 'unique_contraint_name'. Cannot insert duplicate key in object 'dbo.article'.
		 * The duplicate key value is (rijk).
		 *
		 * Index:
		 * insert into [articles] ([unique]) values (@p0)
		 * - Cannot insert duplicate key row in object 'dbo.articles' with unique index 'unique_index_name'.
		 * The duplicate key value is (rijk).
		 *
		 * While it's not ideal, the best next thing we can do is extract the column name from
		 * information_schema when this happens
		 */

		const betweenQuotes = /'([^']+)'/g;
		const betweenParens = /\(([^)]+)\)/g;

		const quoteMatches = error.message.match(betweenQuotes);
		const parenMatches = error.message.match(betweenParens);

		if (!quoteMatches || !parenMatches) return error;

		const [keyNameMatchIndex, collectionNameMatchIndex] =
			error.number === MSSQLErrorCodes.UNIQUE_VIOLATION_INDEX ? [1, 0] : [0, 1];

		const keyName = quoteMatches[keyNameMatchIndex]!.slice(1, -1);

		let collection = quoteMatches[collectionNameMatchIndex]!.slice(1, -1);
		let field: string | null = null;

		if (keyName) {
			const database = getDatabase();

			const constraintUsage = await database
				.select('sys.columns.name as field', database.raw('OBJECT_NAME(??) as collection', ['sys.columns.object_id']))
				.from('sys.indexes')
				.innerJoin('sys.index_columns', (join) => {
					join
						.on('sys.indexes.object_id', '=', 'sys.index_columns.object_id')
						.andOn('sys.indexes.index_id', '=', 'sys.index_columns.index_id');
				})
				.innerJoin('sys.columns', (join) => {
					join
						.on('sys.index_columns.object_id', '=', 'sys.columns.object_id')
						.andOn('sys.index_columns.column_id', '=', 'sys.columns.column_id');
				})
				.where('sys.indexes.name', '=', keyName)
				.first();

			collection = constraintUsage?.collection;
			field = constraintUsage?.field;
		}

		return new RecordNotUniqueError({
			collection,
			field,
			value: field ? data[field] : null,
		});
	}

	function numericValueOutOfRange() {
		const betweenBrackets = /\[([^\]]+)\]/g;

		const bracketMatches = error.message.match(betweenBrackets);

		if (!bracketMatches) return error;

		const collection = bracketMatches[0].slice(1, -1);

		/**
		 * NOTE
		 * MS SQL Doesn't return the offending column name in the error, nor any other identifying information
		 * we can use to extract the column name :(
		 *
		 * insert into [test1] ([small]) values (@p0)
		 * - Arithmetic overflow error for data type tinyint, value = 50000.
		 */

		const field = null;

		return new ValueOutOfRangeError({
			collection,
			field,
			value: field ? data[field] : null,
		});
	}

	function valueLimitViolation() {
		const betweenBrackets = /\[([^\]]+)\]/g;
		const betweenQuotes = /'([^']+)'/g;

		const bracketMatches = error.message.match(betweenBrackets);
		const quoteMatches = error.message.match(betweenQuotes);

		if (!bracketMatches || !quoteMatches) return error;

		const collection = bracketMatches[0].slice(1, -1);
		const field = quoteMatches[1]!.slice(1, -1);

		return new ValueTooLongError({
			collection,
			field,
			value: field ? data[field] : null,
		});
	}

	function notNullViolation() {
		const betweenBrackets = /\[([^\]]+)\]/g;
		const betweenQuotes = /'([^']+)'/g;

		const bracketMatches = error.message.match(betweenBrackets);
		const quoteMatches = error.message.match(betweenQuotes);

		if (!bracketMatches || !quoteMatches) return error;

		const collection = bracketMatches[0].slice(1, -1);
		const field = quoteMatches[0].slice(1, -1);

		if (error.message.includes('Cannot insert the value NULL into column')) {
			return new ContainsNullValuesError({ collection, field });
		}

		return new NotNullViolationError({
			collection,
			field,
		});
	}

	function foreignKeyViolation() {
		const betweenUnderscores = /__(.+)__/g;
		const betweenParens = /\(([^)]+)\)/g;

		// NOTE:
		// Seeing that MS SQL doesn't return the offending column name, we have to extract it from the
		// foreign key constraint name as generated by the database. This'll probably fail if you have
		// custom names for whatever reason.

		const underscoreMatches = error.message.match(betweenUnderscores);
		const parenMatches = error.message.match(betweenParens);

		if (!underscoreMatches || !parenMatches) return error;

		const underscoreParts = underscoreMatches[0].split('__');

		const collection = underscoreParts[1]!;
		const field = underscoreParts[2]!;

		return new InvalidForeignKeyError({
			collection,
			field,
			value: field ? data[field] : null,
		});
	}
}
