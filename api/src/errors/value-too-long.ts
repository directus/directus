import { createError } from '@directus/errors';

export interface ValueTooLongErrorExtensions {
	collection: string;
	field: string;
}

export const messageConstructor = ({ collection, field }: ValueTooLongErrorExtensions) =>
	`Value for field "${field}" in collection "${collection}" is too long.`;

export const ValueTooLongError = createError<ValueTooLongErrorExtensions>('VALUE_TOO_LONG', messageConstructor, 400);
