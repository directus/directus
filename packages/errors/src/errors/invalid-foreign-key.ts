import { createError, ErrorCode } from '../index.js';

export interface InvalidForeignKeyErrorExtensions {
	collection: string | null;
	field: string | null;
	key?: string;
}

export const messageConstructor = ({ collection, field, key }: InvalidForeignKeyErrorExtensions) => {
	let message = 'Invalid foreign key';

	if (key) {
		message += ` "${key}"`;
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
