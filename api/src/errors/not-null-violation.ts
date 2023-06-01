import { createError } from '@directus/errors';

export interface NotNullViolationErrorExtensions {
	collection: string | null;
	field: string | null;
}

export const messageConstructor = ({ collection, field }: NotNullViolationErrorExtensions) => {
	let message = 'Value ';

	if (field) {
		message += `for field "${field}" `;
	}

	if (collection) {
		message += `in collection "${collection}" `;
	}

	message += `can't be null.`;

	return message;
};

export const NotNullViolationError = createError<NotNullViolationErrorExtensions>(
	'NOT_NULL_VIOLATION',
	messageConstructor,
	400
);
