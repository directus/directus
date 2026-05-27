import {
	ContainsNullValuesError,
	InvalidForeignKeyError,
	NotNullViolationError,
	RecordNotUniqueError,
} from '@directus/errors';
import type { Item } from '@directus/types';
import type { SQLiteError } from './types.js';

// NOTE:
// - Sqlite doesn't have varchar with length support, so no ValueTooLongError
// - Sqlite doesn't have a max range for numbers, so no ValueOutOfRangeError

export function extractError(error: SQLiteError, data: Partial<Item>): SQLiteError | Error {
	if (error.message.includes('SQLITE_CONSTRAINT: NOT NULL')) {
		return notNullConstraint(error);
	}

	if (error.message.includes('SQLITE_CONSTRAINT: UNIQUE')) {
		const errorParts = error.message.split(' ');
		const [table, field] = errorParts[errorParts.length - 1]!.split('.');

		if (!table || !field) return error;

		return new RecordNotUniqueError({
			collection: table,
			field,
			value: field ? data[field] : null,
		});
	}

	if (error.message.includes('SQLITE_CONSTRAINT: FOREIGN KEY')) {
		/**
		 * NOTE:
		 * SQLite doesn't return any useful information in it's foreign key constraint failed error, so
		 * we can't extract the table/column/value accurately
		 */
		return new InvalidForeignKeyError({ collection: null, field: null, value: null });
	}

	return error;
}

function notNullConstraint(error: SQLiteError) {
	const errorParts = error.message.split(' ');
	const [table, column] = errorParts[errorParts.length - 1]!.split('.');

	if (table && column) {
		// Now this gets a little finicky... SQLite doesn't have any native ALTER, so Knex implements
		// it by creating a new table, and then copying the data over. That also means we'll never get
		// a ContainsNullValues constraint error, as there is no ALTER. HOWEVER, we can hack around
		// that by checking for the collection name, as Knex's alter default template name will always
		// start with _knex_temp. The best we can do in this case is check for that, and use it to
		// decide between NotNullViolation and ContainsNullValues
		if (table.startsWith('_knex_temp_alter')) {
			return new ContainsNullValuesError({ collection: table, field: column });
		}

		return new NotNullViolationError({
			collection: table,
			field: column,
		});
	}

	return error;
}
