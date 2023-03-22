import { ContainsNullValuesException } from '../contains-null-values';
import { InvalidForeignKeyException } from '../invalid-foreign-key';
import { NotNullViolationException } from '../not-null-violation';
import { RecordNotUniqueException } from '../record-not-unique';
import type { SQLiteError } from './types';

// NOTE:
// - Sqlite doesn't have varchar with length support, so no ValueTooLongException
// - Sqlite doesn't have a max range for numbers, so no ValueOutOfRangeException

export function extractError(error: SQLiteError): SQLiteError | Error {
	if (error.message.includes('SQLITE_CONSTRAINT: NOT NULL')) {
		return notNullConstraint(error);
	}

	if (error.message.includes('SQLITE_CONSTRAINT: UNIQUE')) {
		const errorParts = error.message.split(' ');
		const [table, column] = errorParts[errorParts.length - 1].split('.');

		if (!table || !column) return error;

		return new RecordNotUniqueException(column, {
			collection: table,
			field: column,
		});
	}

	if (error.message.includes('SQLITE_CONSTRAINT: FOREIGN KEY')) {
		/**
		 * NOTE:
		 * SQLite doesn't return any useful information in it's foreign key constraint failed error, so
		 * we can't extract the table/column/value accurately
		 */
		return new InvalidForeignKeyException(null);
	}

	return error;
}

function notNullConstraint(error: SQLiteError) {
	const errorParts = error.message.split(' ');
	const [table, column] = errorParts[errorParts.length - 1].split('.');

	if (table && column) {
		// Now this gets a little finicky... SQLite doesn't have any native ALTER, so Knex implements
		// it by creating a new table, and then copying the data over. That also means we'll never get
		// a ContainsNullValues constraint error, as there is no ALTER. HOWEVER, we can hack around
		// that by checking for the collection name, as Knex's alter default template name will always
		// start with _knex_temp. The best we can do in this case is check for that, and use it to
		// decide between NotNullViolation and ContainsNullValues
		if (table.startsWith('_knex_temp_alter')) {
			return new ContainsNullValuesException(column);
		}

		return new NotNullViolationException(column, {
			collection: table,
			field: column,
		});
	}

	return error;
}
