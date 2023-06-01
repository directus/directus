import { createError } from '@directus/errors';

export interface RecordNotUniqueErrorExtensions {
	collection: string | null;
	field: string | null;
}

export const messageConstructor = ({ collection, field }: RecordNotUniqueErrorExtensions) => {
	let message = 'Value ';

	if (field) {
		message += `for field "${field}" `;
	}

	if (collection) {
		message += `in collection "${collection}" `;
	}

	message += `has to be unique.`;

	return message;
};

export const RecordNotUniqueError = createError<RecordNotUniqueErrorExtensions>(
	'RECORD_NOT_UNIQUE',
	messageConstructor,
	400
);
