import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface InvalidForeignKeyErrorExtensions {
	collection?: string | null;
	field?: string | null;
	value: string | null;
	constraint?: string | null;
}

export const messageConstructor = ({
	collection,
	field,
	value,
	constraint,
}: InvalidForeignKeyErrorExtensions): string => {
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

	if (constraint && !field && !collection) {
		message += ` for constraint "${constraint}"`;
	}

	message += `.`;

	return message;
};

export const InvalidForeignKeyError: DirectusErrorConstructor<InvalidForeignKeyErrorExtensions> =
	createError<InvalidForeignKeyErrorExtensions>(ErrorCode.InvalidForeignKey, messageConstructor, 400);
