import { createError } from '@directus/errors';

export interface ValueOutOfRangeErrorExtensions {
	collection: string | null;
	field: string | null;
}

export const messageConstructor = ({ collection, field }: ValueOutOfRangeErrorExtensions) => {
	let message = 'Numeric value ';

	if (field) {
		message += `for field "${field}" `;
	}

	if (collection) {
		message += `in collection "${collection}" `;
	}

	message += `is out of range.`;

	return message;
};

export const ValueOutOfRangeError = createError<ValueOutOfRangeErrorExtensions>(
	'VALUE_OUT_OF_RANGE',
	messageConstructor,
	400
);
