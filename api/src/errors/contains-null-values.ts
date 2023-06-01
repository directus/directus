import { createError } from '@directus/errors';

interface ContainsNullValuesErrorExtensions {
	collection: string;
	field: string;
}

export const messageConstructor = ({ collection, field }: ContainsNullValuesErrorExtensions) =>
	`Field "${field}" in collection "${collection}" contains null values.`;

export const ContainsNullValuesError = createError<ContainsNullValuesErrorExtensions>(
	'CONTAINS_NULL_VALUES',
	messageConstructor,
	400
);
