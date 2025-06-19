import { createError, ErrorCode } from '../index.js';

export interface InvalidForeignKeyErrorExtensions {
	collection: string | null;
	field: string | null;
	value: string | null;
}

export const messageConstructor = ({ collection, field, value }: InvalidForeignKeyErrorExtensions) => {
	let message = 'Invalid foreign key';

	if (value) {
		message += ` "${value}"`;
	}

	if (field) {
		message += ` for field "${field}"`;
	}

	if (collection) {
		message += ` in collection "${collection}"`;
	}

	message += `.`;

	return message;
};

export const InvalidForeignKeyError = createError<InvalidForeignKeyErrorExtensions>(
	ErrorCode.InvalidForeignKey,
	messageConstructor,
	400,
);
