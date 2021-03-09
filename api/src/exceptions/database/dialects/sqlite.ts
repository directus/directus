import { InvalidForeignKeyException } from '../invalid-foreign-key';
import { RecordNotUniqueException } from '../record-not-unique';
import { NotNullViolationException } from '../not-null-violation';

type SQLiteError = {
	message: string;
	errno: number;
	code: string;
};

// NOTE:
// - Sqlite doesn't have varchar with length support, so no ValueTooLongException
// - Sqlite doesn't have a max range for numbers, so no ValueOutOfRangeException

export function extractError(error: SQLiteError) {
	if (error.message.includes('SQLITE_CONSTRAINT: NOT NULL')) {
		return notNullConstraint(error);
	}

	const betweenTicks = /\`([^\`]+)\`/g;
	const betweenParens = /\(([^\)]+)\)/g;

	const tickMatches = error.message.match(betweenTicks);
	const parenMatches = error.message.match(betweenParens);

	if (!tickMatches || !parenMatches) return error;

	const collection = tickMatches[0].slice(1, -1);
	const field = tickMatches[1].slice(1, -1);
	const invalid = parenMatches[1].slice(1, -1);

	if (error.message.includes('SQLITE_CONSTRAINT: UNIQUE')) {
		return new RecordNotUniqueException(field, {
			collection,
			field,
			invalid,
		});
	}

	if (error.message.includes('SQLITE_CONSTRAINT: FOREIGN KEY')) {
		return new InvalidForeignKeyException(field, {
			collection,
			field,
			invalid,
		});
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
