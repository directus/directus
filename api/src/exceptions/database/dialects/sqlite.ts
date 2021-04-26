import { InvalidForeignKeyException } from '../invalid-foreign-key';
import { RecordNotUniqueException } from '../record-not-unique';
import { NotNullViolationException } from '../not-null-violation';
import { SQLiteError } from './types';

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
		return new NotNullViolationException(column, {
			collection: table,
			field: column,
		});
	}

	return error;
}
