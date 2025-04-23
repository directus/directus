import { createError, ErrorCode } from '../index.js';

export interface ValueOutOfRangeErrorExtensions {
	collection: string | null;
	field: string | null;
	value: string | null;
}

export const messageConstructor = ({ collection, field, value }: ValueOutOfRangeErrorExtensions) => {
	let message = 'Numeric value ';

	if (value) {
		message += `"${value}" `;
	}

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
	ErrorCode.ValueOutOfRange,
	messageConstructor,
	400,
);
