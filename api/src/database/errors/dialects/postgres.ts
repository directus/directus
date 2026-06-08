import {
	ContainsNullValuesError,
	InvalidForeignKeyError,
	NotNullViolationError,
	RecordNotUniqueError,
	ValueOutOfRangeError,
	ValueTooLongError,
} from '@directus/errors';
import type { Item, SchemaOverview } from '@directus/types';
import type { PostgresError } from './types.js';

enum PostgresErrorCodes {
	FOREIGN_KEY_VIOLATION = '23503',
	NOT_NULL_VIOLATION = '23502',
	NUMERIC_VALUE_OUT_OF_RANGE = '22003',
	UNIQUE_VIOLATION = '23505',
	VALUE_LIMIT_VIOLATION = '22001',
}

export function extractError(
	error: PostgresError,
	data: Partial<Item>,
	schema?: SchemaOverview,
): PostgresError | Error {
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
		const regex = /"(.*?)"/g;
		const matches = error.message.match(regex);

		if (!matches) return error;

		const collection = matches[0].slice(1, -1);

		let field = matches[1]?.slice(1, -1) ?? null;
		let inputValue = field ? data[field] : null;

		if (collection && schema && schema.collections[collection]) {
			for (const [key, value] of Object.entries(data)) {
				const fieldInfo = schema.collections[collection].fields[key];

				if (fieldInfo?.dbType !== 'numeric' || typeof value !== 'string') continue;

				const [integerPart = '', decimalPart = ''] = value.split('.');

				if (
					(fieldInfo.precision && integerPart.length > (fieldInfo.precision ?? 0) - (fieldInfo.scale ?? 0)) ||
					(fieldInfo.scale && decimalPart.length > (fieldInfo.scale ?? 0))
				) {
					field = key;
					inputValue = value;
					break;
				}
			}
		}

		return new ValueOutOfRangeError({
			collection,
			field: field,
			value: inputValue,
		});
	}

	function valueLimitViolation() {
		/**
		 * NOTE:
		 * Postgres doesn't return the offending column
		 */

		const regex = /"(.*?)"/g;
		const matches = error.message.match(regex);

		if (!matches) return error;
		const collection = matches[0].slice(1, -1);
		const field = matches[1]?.slice(1, -1) ?? null;

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
